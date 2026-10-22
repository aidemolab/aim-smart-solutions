// submit-enquiry: the enquiry endpoint for the static (GitHub Pages) site.
// NOT YET DEPLOYED. It replaces the old /api/calls route + save-business-enquiry
// pair for the new site only; save-business-enquiry stays untouched for the
// live ChatGPT Sites version.
//
// Steps: Turnstile check -> validation -> per-IP / per-number daily limits ->
// save customer + enquiry -> (urgent + consent) start the Vapi call -> email.
//
// Secrets it needs (Supabase > Edge Functions > Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY        (provided by Supabase)
//   TURNSTILE_SECRET_KEY                           (new)
//   VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID   (already set for vapi-outbound-call)
//   IONOS_SMTP_HOST, IONOS_SMTP_PORT, IONOS_SMTP_USER, IONOS_SMTP_PASSWORD (already set)
// Optional: RATE_LIMIT_SALT, ALLOWED_ORIGINS, TURNSTILE_HOSTNAMES
// Needs migration 20261022120000_submit_enquiry_protection.sql applied first.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { withCors } from "../_shared/cors.ts";

// Daily limits (UTC day). Calls cost money and ring real phones, so they are tighter.
const LIMITS = {
  enquiriesPerIp: 5,
  enquiriesTotal: 100,
  callsPerIp: 2,
  callsPerNumber: 2,
  callsTotal: 20,
};

const DEFAULT_TURNSTILE_HOSTNAMES = ["aimsmartsolutions.tech", "www.aimsmartsolutions.tech", "aidemolab.github.io", "localhost"];

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("");
}

function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip !== "unknown") form.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const result = await response.json();
    if (result?.success !== true) return false;
    const hostnames = (Deno.env.get("TURNSTILE_HOSTNAMES")?.split(",").map((h) => h.trim()).filter(Boolean)) ?? DEFAULT_TURNSTILE_HOSTNAMES;
    return hostnames.includes(result.hostname);
  } catch (error) {
    console.error("Turnstile verification failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

Deno.serve(withCors(async (request: Request) => {
  if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);
  if (Number(request.headers.get("content-length") || 0) > 20000) return json({ ok: false, message: "Request too large." }, 413);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, message: "The enquiry service is unavailable." }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: "Invalid request." }, 400); }

  // 1. CAPTCHA first, so bots cannot use up anyone's daily allowance.
  const ip = clientIp(request);
  if (!(await verifyTurnstile(clean(body.turnstileToken, 4096), ip))) {
    return json({ ok: false, message: "Please complete the security check and try again." }, 403);
  }

  // 2. Validate.
  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 150);
  const email = clean(body.email, 254).toLowerCase();
  const mobile = clean(body.mobile, 30).replace(/[\s()-]/g, "");
  const enquiryText = clean(body.enquiry, 5000);
  const urgency = body.urgency === "urgent" ? "urgent" : "normal";
  const consent = body.consent === true;

  if (!name || !businessName || !enquiryText || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, message: "Complete all enquiry fields." }, 400);
  }
  if (!/^\+447\d{9}$/.test(mobile)) {
    return json({ ok: false, message: "Enter a valid UK mobile number beginning 07 or +44 7." }, 400);
  }
  if (urgency === "urgent" && !consent) {
    return json({ ok: false, message: "Please confirm you agree to receive an automated call, or choose Normal." }, 400);
  }

  // 3. Daily limits: hashed IP and number, never stored in plain text.
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
  const ipBucket = "ip:" + await sha256Hex(salt + ip);
  const numberBucket = "tel:" + await sha256Hex(salt + mobile);
  const consume = async (bucket: string, limit: number): Promise<boolean | null> => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/form_consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({ p_bucket: bucket, p_limit: limit }),
      });
      if (!response.ok) return null;
      return (await response.json()) === true;
    } catch {
      return null;
    }
  };

  const checks: [string, number][] = [
    ["enquiry:global", LIMITS.enquiriesTotal],
    [`enquiry:${ipBucket}`, LIMITS.enquiriesPerIp],
  ];
  if (urgency === "urgent") {
    checks.push(["call:global", LIMITS.callsTotal], [`call:${ipBucket}`, LIMITS.callsPerIp], [`call:${numberBucket}`, LIMITS.callsPerNumber]);
  }
  for (const [bucket, limit] of checks) {
    const allowed = await consume(bucket, limit);
    if (allowed === null) return json({ ok: false, message: "The enquiry service is temporarily unavailable." }, 503);
    if (!allowed) {
      return json({
        ok: false,
        message: bucket.startsWith("call:")
          ? "We cannot place another automated call today. Please choose Normal, or email enquiry@aimsmartsolutions.tech."
          : "Daily enquiry limit reached. Please email enquiry@aimsmartsolutions.tech.",
      }, 429);
    }
  }

  // 4. Save customer and enquiry.
  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation",
  };
  const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?on_conflict=email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, business_name: businessName, email, mobile }),
  });
  if (!customerResponse.ok) {
    console.error("Customer save failed", customerResponse.status);
    return json({ ok: false, message: "We could not save your enquiry." }, 502);
  }
  const customerId = (await customerResponse.json())?.[0]?.id;
  if (!customerId) return json({ ok: false, message: "We could not save your enquiry." }, 502);

  const enquiryResponse = await fetch(`${supabaseUrl}/rest/v1/enquiries`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({
      customer_id: customerId,
      enquiry_text: enquiryText,
      urgency,
      status: "new",
      call_consent_at: urgency === "urgent" ? new Date().toISOString() : null,
    }),
  });
  if (!enquiryResponse.ok) {
    console.error("Enquiry save failed", enquiryResponse.status);
    return json({ ok: false, message: "We could not save your enquiry." }, 502);
  }

  // 5. Urgent: start the Vapi call server-side. The enquiry is already saved,
  //    so a failed call is reported, not treated as a failed submission.
  let callStarted = false;
  if (urgency === "urgent") {
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    const assistantId = Deno.env.get("VAPI_ASSISTANT_ID");
    const phoneNumberId = Deno.env.get("VAPI_PHONE_NUMBER_ID");
    if (!vapiApiKey || !assistantId || !phoneNumberId) {
      console.error("One or more Vapi settings are missing.");
    } else {
      try {
        const response = await fetch("https://api.vapi.ai/call/phone", {
          method: "POST",
          headers: { "Authorization": `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ assistantId, phoneNumberId, customer: { number: mobile } }),
        });
        callStarted = response.ok;
        if (!response.ok) console.error("Vapi call creation failed:", response.status);
      } catch (error) {
        console.error("Vapi request failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }
  }

  // 6. Acknowledgement email.
  let emailSent = false;
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST");
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER");
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD");
  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isInteger(smtpPort)) {
    console.error("SMTP configuration is incomplete");
  } else {
    const urgentLine = urgency !== "urgent"
      ? ""
      : callStarted
        ? "You selected Urgent. Our AI assistant is calling the mobile number you provided."
        : "You selected Urgent. We will contact you as a priority.";
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost, port: smtpPort, secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPassword },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      });
      await transporter.sendMail({
        from: `AIM Smart Solutions <${smtpUser}>`,
        to: email,
        replyTo: smtpUser,
        subject: "We have received your enquiry - AIM Smart Solutions",
        text: `Hello ${name},\n\nThank you for contacting AIM Smart Solutions. We have received your enquiry and will get back to you within 24 hours.\n\nYour enquiry:\n${enquiryText}${urgentLine ? `\n\n${urgentLine}` : ""}\n\nKind regards,\nAIM Smart Solutions\n${smtpUser}`,
        html: `<p>Hello ${escapeHtml(name)},</p><p>Thank you for contacting AIM Smart Solutions. We have received your enquiry and will get back to you within 24 hours.</p><p><strong>Your enquiry:</strong><br>${escapeHtml(enquiryText).replaceAll("\n", "<br>")}</p>${urgentLine ? `<p>${escapeHtml(urgentLine)}</p>` : ""}<p>Kind regards,<br>AIM Smart Solutions<br><a href="mailto:${smtpUser}">${smtpUser}</a></p>`,
      });
      emailSent = true;
    } catch (error) {
      console.error("Acknowledgement email failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return json({ ok: true, emailSent, callStarted });
}));
