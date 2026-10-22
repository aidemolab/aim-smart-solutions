import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ ok: false, message: "Method not allowed." }, 405);
  }

  const expectedToken = Deno.env.get("VOICE_AGENT_SITES_TOKEN");
  const suppliedToken = req.headers
    .get("OAI-Sites-Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!expectedToken) {
    console.error("VOICE_AGENT_SITES_TOKEN is not configured.");
    return json({ ok: false, message: "Service is not configured." }, 500);
  }

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return json({ ok: false, message: "Unauthorised request." }, 401);
  }

  const vapiApiKey = Deno.env.get("VAPI_API_KEY");
  const assistantId = Deno.env.get("VAPI_ASSISTANT_ID");
  const phoneNumberId = Deno.env.get("VAPI_PHONE_NUMBER_ID");

  if (!vapiApiKey || !assistantId || !phoneNumberId) {
    console.error("One or more Vapi settings are missing.");
    return json({ ok: false, message: "Service is not configured." }, 500);
  }

  let payload: { phone?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request body." }, 400);
  }

  const phone = typeof payload.phone === "string"
    ? payload.phone.replace(/[\s()-]/g, "")
    : "";

  if (!/^\+447\d{9}$/.test(phone)) {
    return json({ ok: false, message: "Enter a valid UK mobile number." }, 400);
  }

  try {
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: phone },
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Vapi call creation failed:", response.status, result);
      return json(
        { ok: false, message: "The call could not be started." },
        response.status >= 500 ? 502 : 400,
      );
    }

    return json({
      ok: true,
      callId: result.id ?? null,
      status: result.status ?? "queued",
    });
  } catch (error) {
    console.error("Vapi request failed:", error);
    return json({ ok: false, message: "The call service is unavailable." }, 502);
  }
});
