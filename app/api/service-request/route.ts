const UK_MOBILE = /^(?:\+44|0044|0)?7\d{9}$/;

function toE164(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s().-]/g, "");
  if (!UK_MOBILE.test(compact)) return null;
  if (compact.startsWith("+44")) return compact;
  if (compact.startsWith("0044")) return `+${compact.slice(2)}`;
  if (compact.startsWith("0")) return `+44${compact.slice(1)}`;
  return `+44${compact}`;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, message: "The service request was not valid." }, { status: 400 }); }
  const mobile = toE164(body.mobile);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const business = typeof body.business === "string" ? body.business.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const services = Array.isArray(body.services) ? body.services : [];
  if (!name || !business || !email || !mobile || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || services.length === 0) return Response.json({ ok: false, message: "Complete your details and select at least one service." }, { status: 400 });
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return Response.json({ ok: false, message: "The service request is temporarily unavailable." }, { status: 503 });
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/save-service-request`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseAnonKey}`, "apikey": supabaseAnonKey }, body: JSON.stringify({ name, businessName: business, email, mobile, services }) });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ ok: false, message: "The service request is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
