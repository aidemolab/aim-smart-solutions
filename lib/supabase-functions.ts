// Calls Supabase Edge Functions straight from the browser. This replaces the old
// Next.js API routes, which cannot run on GitHub Pages.
//
// Both values below are compiled into the public site. That is safe only because
// the anon key is designed to be public: the functions hold the real secrets
// (service-role key, SMTP password, voice-agent token) on the Supabase side.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type FunctionResult = { ok?: boolean; message?: string; [key: string]: unknown };

export async function callFunction(
  name: "appointment-booking" | "save-service-request" | "submit-enquiry",
  body: unknown,
): Promise<{ status: number; result: FunctionResult | null }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { status: 503, result: { ok: false, message: "This service is not configured yet. Please email enquiry@aimsmartsolutions.tech." } };
  }
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => null)) as FunctionResult | null;
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
