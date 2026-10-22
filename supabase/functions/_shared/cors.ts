// Lets the static website call these functions straight from the browser.
// Only the origins listed here get CORS headers, so other websites' browsers
// cannot read the responses. Override with ALLOWED_ORIGINS (comma-separated).
// This is not a substitute for a CAPTCHA or rate limit: non-browser clients
// ignore CORS entirely.

const DEFAULT_ORIGINS = [
  "https://aimsmartsolutions.tech",
  "https://www.aimsmartsolutions.tech",
  "https://aidemolab.github.io",
  "http://localhost:3000",
];

function allowedOrigins(): string[] {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  return configured ? configured.split(",").map((o) => o.trim()).filter(Boolean) : DEFAULT_ORIGINS;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const cors = corsHeaders(request.headers.get("Origin"));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const response = await handler(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
}
