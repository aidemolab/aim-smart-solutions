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
  let body: { firstName?: unknown; businessName?: unknown; email?: unknown; phone?: unknown; enquiry?: unknown; urgency?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, message: "The call request was not valid." }, { status: 400 }); }

  const phone = toE164(body.phone);
  if (!phone) return Response.json({ ok: false, message: "Enter a valid UK mobile number beginning 07 or +44 7." }, { status: 400 });

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const enquiry = typeof body.enquiry === "string" ? body.enquiry.trim() : "";
  const urgency = body.urgency === "urgent" ? "urgent" : "normal";
  if (!firstName || !businessName || !email || !enquiry) {
    return Response.json({ ok: false, message: "Complete all enquiry fields before submitting." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ ok: false, message: "The enquiry service is not configured." }, { status: 503 });
  }

  try {
    const saveResponse = await fetch(`${supabaseUrl}/functions/v1/save-business-enquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({
        name: firstName,
        businessName,
        email,
        mobile: phone,
        enquiry,
        urgency,
      }),
    });
    if (!saveResponse.ok) {
      return Response.json({ ok: false, message: "We could not save your enquiry. Please try again." }, { status: 502 });
    }
  } catch {
    return Response.json({ ok: false, message: "The enquiry service is temporarily unavailable. Please try again." }, { status: 502 });
  }

  if (urgency !== "urgent") return Response.json({ ok: true });

  const endpoint = process.env.VOICE_AGENT_CALL_URL;
  const authToken = process.env.VOICE_AGENT_SITES_TOKEN;
  if (!endpoint || !authToken) return Response.json({ ok: false, message: "The call service is not configured." }, { status: 503 });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "OAI-Sites-Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({ phone }),
    });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" } });
  } catch {
    return Response.json({ ok: false, message: "The server could not reach the existing call service. Please try again." }, { status: 502 });
  }
}
