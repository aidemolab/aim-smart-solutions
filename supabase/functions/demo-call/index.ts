// demo-call: the "Try it now: get a call from our AI receptionist" demo on
// /services/ai-voice-agents/. The visitor gives a first name and a UK mobile; this
// function checks Turnstile and the limits, then asks Vapi to phone them with the
// "AIM Demo Receptionist" assistant. The Vapi private key never leaves Supabase.
//
// Steps: honeypot -> Turnstile (required) -> validation -> per-IP daily limit ->
// site-wide daily cap and one call per number in 24 hours (demo_call_claim in SQL) ->
// Vapi outbound call. Nothing about the visitor is stored except salted hashes of
// the IP (daily counter) and number (for the one-call limit).
//
// Secrets (Supabase > Edge Functions > Secrets), all already set for submit-enquiry:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY,
//   VAPI_API_KEY, VAPI_PHONE_NUMBER_ID
// Optional: VAPI_DEMO_ASSISTANT_ID (defaults to the demo copy below), RATE_LIMIT_SALT,
//           ALLOWED_ORIGINS, TURNSTILE_HOSTNAMES
// Needs migration 20261101120000_demo_call_caps.sql.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withCors } from "../_shared/cors.ts";

// Must match the tick box on the site (lib/demos.ts DEMO_CALL_CONSENT).
const CONSENT_TEXT = "I agree to receive one demo call from AIM's AI receptionist";

// "AIM Demo Receptionist" in Vapi: a copy of the call-back assistant with recording off.
const DEFAULT_DEMO_ASSISTANT_ID = "4d2334d1-8776-49ee-badc-37035e7dd6b0";

const LIMITS = { callsPerIp: 3, callsTotal: 10 };
const MAX_CALL_SECONDS = 180;
const WRAP_UP_AT_SECONDS = 160;
const WRAP_UP_LINE =
  "We're nearly out of time for this demo, so I'll let you go. Thanks for trying Aim Smart Solutions' AI receptionist. You can book a free AI Opportunity Call on the Aim Smart Solutions website. Goodbye!";

const DEFAULT_TURNSTILE_HOSTNAMES = ["aimsmartsolutions.tech", "www.aimsmartsolutions.tech", "aidemolab.github.io", "localhost"];

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

// The name is spoken in the opening line, so keep only letters, spaces, hyphens and
// apostrophes: nothing that could read as an instruction to the assistant.
function cleanName(value: unknown): string {
  const name = clean(value, 60).replace(/[^\p{L}' -]/gu, "").replace(/\s+/g, " ").trim().slice(0, 30);
  return /\p{L}/u.test(name) ? name : "";
}

// UK mobiles only: 07…, +447… or 00447…, returned as +447….
function toUkMobile(value: unknown): string | null {
  const compact = clean(value, 30).replace(/[\s().-]/g, "");
  const match = compact.match(/^(?:\+44|0044|0)(7\d{9})$/);
  return match ? `+44${match[1]}` : null;
}

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
  if (Number(request.headers.get("content-length") || 0) > 10000) return json({ ok: false, message: "Request too large." }, 413);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const vapiApiKey = Deno.env.get("VAPI_API_KEY");
  const phoneNumberId = Deno.env.get("VAPI_PHONE_NUMBER_ID");
  const assistantId = Deno.env.get("VAPI_DEMO_ASSISTANT_ID") || DEFAULT_DEMO_ASSISTANT_ID;
  // Calls ring real phones and cost money: without every setting, there is no call.
  if (!supabaseUrl || !serviceKey || !turnstileSecret || !vapiApiKey || !phoneNumberId) {
    console.error("demo-call is missing a setting");
    return json({ ok: false, code: "unavailable", message: "The demo call is not available right now. Please try again later." }, 503);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ ok: false, code: "invalid", message: "Invalid request." }, 400); }

  // 1. Honeypot: pretend it worked, place no call.
  if (clean(body.website, 500)) return json({ ok: true });

  // 2. Turnstile before the limits, so bots cannot use up anyone's allowance.
  const ip = clientIp(request);
  if (!(await verifyTurnstile(turnstileSecret, clean(body.turnstileToken, 4096), ip))) {
    return json({ ok: false, code: "captcha", message: "Please complete the security check and try again." }, 403);
  }

  // 3. Validate.
  const name = cleanName(body.name);
  const mobile = toUkMobile(body.mobile);
  if (!name) return json({ ok: false, code: "name", message: "Please enter your first name." }, 400);
  if (!mobile) return json({ ok: false, code: "number", message: "Please enter a UK mobile number starting 07 or +44 7." }, 400);
  if (body.consent !== true) return json({ ok: false, code: "consent", message: "Please tick the box to agree to the demo call." }, 400);

  // 4. Limits, with hashed IP and number.
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
  const ipBucket = "democall:ip:" + await sha256Hex(salt + ip);
  const numberHash = "tel:" + await sha256Hex(salt + mobile);
  const rpc = async (fn: string, args: unknown): Promise<unknown> => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify(args),
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };

  const ipAllowed = await rpc("form_consume", { p_bucket: ipBucket, p_limit: LIMITS.callsPerIp });
  if (ipAllowed === null) return json({ ok: false, code: "unavailable", message: "The demo call is not available right now. Please try again later." }, 503);
  if (ipAllowed !== true) return json({ ok: false, code: "limit", message: "You have reached today's limit of demo calls. Please try again tomorrow." }, 429);

  const claim = await rpc("demo_call_claim", { p_number_hash: numberHash, p_daily_limit: LIMITS.callsTotal });
  if (claim === "number") return json({ ok: false, code: "limit", message: "This number has already had a demo call today. Please try again tomorrow." }, 429);
  if (claim === "daily") return json({ ok: false, code: "busy", message: "Today's demo calls are all used up. Please try again tomorrow." }, 429);
  if (claim !== "ok") return json({ ok: false, code: "unavailable", message: "The demo call is not available right now. Please try again later." }, 503);

  // 5. Place the call. The overrides repeat the demo-only settings so they hold
  //    even if the assistant is edited in the dashboard.
  try {
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: { "Authorization": `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: mobile },
        assistantOverrides: {
          firstMessage: `Hi ${name}, this is Aim Smart Solutions' AI receptionist, calling for your demo. How can I help?`,
          maxDurationSeconds: MAX_CALL_SECONDS,
          artifactPlan: { recordingEnabled: false },
          hooks: [{ on: "call.timeElapsed", options: { seconds: WRAP_UP_AT_SECONDS }, do: [{ type: "say", exact: WRAP_UP_LINE }] }],
        },
      }),
    });
    if (!response.ok) {
      console.error("Vapi call creation failed:", response.status, (await response.text()).slice(0, 300));
      return json({ ok: false, code: "failed", message: "We could not place the call just now. Please try again later." }, 502);
    }
  } catch (error) {
    console.error("Vapi request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ ok: false, code: "failed", message: "We could not place the call just now. Please try again later." }, 502);
  }

  console.log("Demo call started. Consent:", CONSENT_TEXT);
  return json({ ok: true });
}));
