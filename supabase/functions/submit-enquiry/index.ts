// submit-enquiry: the enquiry endpoint for the static (GitHub Pages) site.
// Deployed 2026-10-22. It replaces the old /api/calls route + save-business-enquiry
// pair for the new site only; save-business-enquiry stays untouched for the
// live ChatGPT Sites version.
//
// Steps: honeypot -> Turnstile check (only when configured) -> validation ->
// per-IP daily enquiry limits -> save customer + enquiry ->
// (calls enabled + urgent + consent + under the call caps) start the Vapi call ->
// customer acknowledgement email -> owner notification email.
// Over a call cap there is no call, but the enquiry is still saved and emailed.
//
// Turnstile is OPTIONAL. Without TURNSTILE_SECRET_KEY the function still saves
// enquiries and sends both emails, but never starts an AI call (calls ring real
// phones and cost money, so they need the CAPTCHA). Responses carry
// callsEnabled so the form can hide the Urgent option.
//
// Secrets it needs (Supabase > Edge Functions > Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY        (provided by Supabase)
//   TURNSTILE_SECRET_KEY                           (optional: set it to enable AI calls)
//   VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID   (already set for vapi-outbound-call)
//   IONOS_SMTP_HOST, IONOS_SMTP_PORT, IONOS_SMTP_USER, IONOS_SMTP_PASSWORD (already set)
// Optional: RATE_LIMIT_SALT, ALLOWED_ORIGINS, TURNSTILE_HOSTNAMES,
//           OWNER_EMAIL (default enquiry@aimsmartsolutions.tech)
// Needs migrations 20261022120000_submit_enquiry_protection.sql and
// 20261023120000_call_caps.sql applied first.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { withCors } from "../_shared/cors.ts";

// Canonical wording of the call-consent checkbox, by version. The form sends only
// the version; the wording stored with the enquiry comes from here, so a visitor
// cannot alter what is recorded. Must match lib/consent.ts exactly (checked by
// tests/static-export.test.mjs). To change the wording, add a new version.
const CONSENT_WORDING: Record<string, string> = {
  "2026-10-22":
    "I agree to receive one automated phone call from the AIM Smart Solutions AI assistant to the mobile number above about this enquiry.",
};

const DEFAULT_OWNER_EMAIL = "enquiry@aimsmartsolutions.tech";

// Daily limits (UTC day). Calls cost money and ring real phones, so they are tighter.
// Calls are also limited to one per number in any 24 hours (call_claim in SQL).
const LIMITS = {
  enquiriesPerIp: 5,
  enquiriesTotal: 100,
  callsPerIp: 2,
  callsTotal: 10,
};
const MAX_CALL_SECONDS = 180;

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

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  if (!token) return false;
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

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
  const callsEnabled = turnstileSecret !== "";

  // 1. Honeypot: a hidden field people never see. If it is filled in, a bot sent
  //    this, so pretend it worked and save nothing.
  if (clean(body.website, 500)) {
    return json({ ok: true, emailSent: true, callStarted: false, ownerNotified: true, callsEnabled });
  }

  // 2. CAPTCHA (when configured) before the limits, so bots cannot use up anyone's
  //    daily allowance.
  const ip = clientIp(request);
  if (callsEnabled && !(await verifyTurnstile(turnstileSecret, clean(body.turnstileToken, 4096), ip))) {
    return json({ ok: false, message: "Please complete the security check and try again.", callsEnabled }, 403);
  }

  // 3. Validate. Without Turnstile there are no calls, so Urgent is treated as Normal.
  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 150);
  const email = clean(body.email, 254).toLowerCase();
  const mobile = clean(body.mobile, 30).replace(/[\s()-]/g, "");
  const enquiryText = clean(body.enquiry, 5000);
  const urgency = callsEnabled && body.urgency === "urgent" ? "urgent" : "normal";
  const consent = body.consent === true;
  const consentVersion = clean(body.consentVersion, 20);

  if (!name || !businessName || !enquiryText || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, message: "Complete all enquiry fields." }, 400);
  }
  if (!/^\+447\d{9}$/.test(mobile)) {
    return json({ ok: false, message: "Enter a valid UK mobile number beginning 07 or +44 7." }, 400);
  }
  if (urgency === "urgent" && (!consent || !CONSENT_WORDING[consentVersion])) {
    return json({ ok: false, message: "Please confirm you agree to receive an automated call, or choose Normal." }, 400);
  }

  // 4. Daily limits: hashed IP and number, never stored in plain text.
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
  for (const [bucket, limit] of checks) {
    const allowed = await consume(bucket, limit);
    if (allowed === null) return json({ ok: false, message: "The enquiry service is temporarily unavailable." }, 503);
    if (!allowed) {
      return json({ ok: false, message: "Daily enquiry limit reached. Please email enquiry@aimsmartsolutions.tech.", callsEnabled }, 429);
    }
  }

  // Call caps: per IP per day, then (atomically, in SQL) 10 a day site-wide and
  // one per number in 24 hours. UK numbers only. Any failure means no call.
  const claimCall = async (): Promise<boolean> => {
    if (!mobile.startsWith("+44")) return false;
    if ((await consume(`call:${ipBucket}`, LIMITS.callsPerIp)) !== true) return false;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/call_claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({ p_number_hash: numberBucket, p_daily_limit: LIMITS.callsTotal }),
      });
      const result = response.ok ? await response.json() : "error";
      if (result !== "ok") console.log("AI call skipped:", result);
      return result === "ok";
    } catch {
      return false;
    }
  };

  // 5. Save customer and enquiry.
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
      call_consent_version: urgency === "urgent" ? consentVersion : null,
      call_consent_text: urgency === "urgent" ? CONSENT_WORDING[consentVersion] : null,
    }),
  });
  if (!enquiryResponse.ok) {
    console.error("Enquiry save failed", enquiryResponse.status);
    return json({ ok: false, message: "We could not save your enquiry." }, 502);
  }

  // 6. Urgent: start the Vapi call server-side. The enquiry is already saved,
  //    so a failed call is reported, not treated as a failed submission.
  let callStarted = false;
  if (urgency === "urgent") {
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    const assistantId = Deno.env.get("VAPI_ASSISTANT_ID");
    const phoneNumberId = Deno.env.get("VAPI_PHONE_NUMBER_ID");
    if (!vapiApiKey || !assistantId || !phoneNumberId) {
      console.error("One or more Vapi settings are missing.");
    } else if (await claimCall()) {
      try {
        const response = await fetch("https://api.vapi.ai/call/phone", {
          method: "POST",
          headers: { "Authorization": `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            assistantId,
            phoneNumberId,
            customer: { number: mobile },
            assistantOverrides: { maxDurationSeconds: MAX_CALL_SECONDS },
          }),
        });
        callStarted = response.ok;
        if (!response.ok) console.error("Vapi call creation failed:", response.status);
      } catch (error) {
        console.error("Vapi request failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }
  }

  // 7. Emails: customer acknowledgement, then owner notification (which reports
  //    whether the acknowledgement went). Failures are logged, not fatal: the
  //    enquiry is already saved.
  let emailSent = false;
  let ownerNotified = false;
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST");
  const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("IONOS_SMTP_USER");
  const smtpPassword = Deno.env.get("IONOS_SMTP_PASSWORD");
  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isInteger(smtpPort)) {
    console.error("SMTP configuration is incomplete");
  } else {
    const transporter = nodemailer.createTransport({
      host: smtpHost, port: smtpPort, secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
    const urgentLine = urgency !== "urgent"
      ? ""
      : callStarted
        ? "You selected Urgent. Our AI assistant is calling the mobile number you provided."
        : "You selected Urgent. We will contact you as a priority.";
    try {
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

    const ownerEmail = Deno.env.get("OWNER_EMAIL") || DEFAULT_OWNER_EMAIL;
    const yesNo = (value: boolean) => value ? "Yes" : "No";
    // Keep visitor text out of the header on one line (no header injection).
    const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ");
    const callLine = urgency === "urgent" ? yesNo(callStarted) : "Not requested";
    const details: [string, string][] = [
      ["Name", name],
      ["Business", businessName],
      ["Email", email],
      ["Mobile", mobile],
      ["Urgency", urgency === "urgent" ? "Urgent" : "Normal"],
      ["Acknowledgement email sent", yesNo(emailSent)],
      ["AI call started", callLine],
    ];
    if (urgency === "urgent") details.push(["Call consent", `Yes (version ${consentVersion})`]);
    try {
      await transporter.sendMail({
        from: `AIM Smart Solutions website <${smtpUser}>`,
        to: ownerEmail,
        replyTo: email,
        subject: oneLine(`${urgency === "urgent" ? "[URGENT] " : ""}New enquiry - ${businessName} (${name})`),
        text: `${details.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nEnquiry:\n${enquiryText}`,
        html: `<p><strong>New website enquiry</strong></p><table cellpadding="4">${details.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join("")}</table><p><strong>Enquiry:</strong><br>${escapeHtml(enquiryText).replaceAll("\n", "<br>")}</p>`,
      });
      ownerNotified = true;
    } catch (error) {
      console.error("Owner notification email failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  return json({ ok: true, emailSent, callStarted, ownerNotified, callsEnabled });
}));
