// Calls Supabase Edge Functions straight from the browser. This replaces the old
// Next.js API routes, which cannot run on GitHub Pages.
//
// Both values below are compiled into the public site. That is safe only because
// the anon key is designed to be public: the functions hold the real secrets
// (service-role key, SMTP password, voice-agent token) on the Supabase side.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type FunctionResult = { ok?: boolean; message?: string; [key: string]: unknown };

export const CONTACT_EMAIL = "enquiry@aimsmartsolutions.tech";

// Shown instead of the browser's raw "Failed to fetch" when the request never
// reaches the server (offline, blocked, DNS, CORS).
export const NETWORK_ERROR_MESSAGE =
  `We could not reach our system just now. Please check your connection and try again, or email us at ${CONTACT_EMAIL}.`;

// Name of the hidden honeypot field. People never see it; bots that fill in
// every field do, and the functions then quietly discard the submission.
export const HONEYPOT_FIELD = "website";

export async function callFunction(
  name: "appointment-booking" | "save-service-request" | "submit-enquiry",
  body: unknown,
): Promise<{ status: number; result: FunctionResult | null }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { status: 503, result: { ok: false, message: "This service is not configured yet. Please email enquiry@aimsmartsolutions.tech." } };
  }
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { status: 0, result: { ok: false, message: NETWORK_ERROR_MESSAGE } };
  }
  const result = (await response.json().catch(() => null)) as FunctionResult | null;
  if (!result?.message && response.status >= 400) {
    return { status: response.status, result: { ...result, ok: false, message: `Something went wrong on our side. Please try again, or email us at ${CONTACT_EMAIL}.` } };
  }
  return { status: response.status, result };
}

const UK_MOBILE = /^(?:\+44|0044|0)?7\d{9}$/;

// Returns the number in +447… form, or null if it is not a UK mobile.
export function toUkE164(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s().-]/g, "");
  if (!UK_MOBILE.test(compact)) return null;
  if (compact.startsWith("+44")) return compact;
  if (compact.startsWith("0044")) return `+${compact.slice(2)}`;
  if (compact.startsWith("0")) return `+44${compact.slice(1)}`;
  return `+44${compact}`;
}
