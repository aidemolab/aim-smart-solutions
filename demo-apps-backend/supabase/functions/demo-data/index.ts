// demo-data: the ONLY way the three AIM demo apps write data.
// Deployed to the "AIM Pharmaceutical AI Demo" project (xlxyphqzdzhipmllhxaq).
//
// POST { app, action, session, id?, record? }
//   app:     "suppliers" | "leads" | "properties"
//   action:  "add" | "update" | "delete" | "reset"
//   session: the visitor's random UUID (kept in the browser's localStorage)
//
// Protections: origin lock, size limit, strict field validation, 50 records per session,
// per-IP and global daily write limits (same pattern as pharma-openrouter-chat), seed rows
// can never be changed because every change is matched on BOTH id and session.
// Uses the service role inside the function only; nothing secret reaches the browser.

const ALLOWED_ORIGIN = "https://aidemolab.github.io";
const MAX_BODY_BYTES = 8000;
const MAX_ROWS_PER_SESSION = 50;
const IP_DAILY_LIMIT = Number(Deno.env.get("DEMO_IP_DAILY_LIMIT") ?? 120);
const GLOBAL_DAILY_LIMIT = Number(Deno.env.get("DEMO_GLOBAL_DAILY_LIMIT") ?? 3000);

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

// ---------------------------------------------------------------- field specs

type Spec =
  | { kind: "text"; max: number; required?: boolean }
  | { kind: "int"; min: number; max: number }
  | { kind: "num"; min: number; max: number; decimals: number }
  | { kind: "enum"; options: string[] }
  | { kind: "flags"; options: string[]; maxItems: number }
  | { kind: "flagstr"; options: string[]; maxItems: number };

const SUPPLIER_FLAGS = ["High dependency", "Contract expiring soon", "Poor delivery", "Multiple incidents", "Contract expiring", "Above average incidents", "Low quality rating", "Geopolitical risk"];
const LEAD_FLAGS = ["Long sales cycle", "Many stakeholders", "Budget below average", "Single champion", "No follow-up", "Low engagement", "Low budget", "Long timeline", "Single decision maker", "No engagement", "Outside core ICP"];
const PROPERTY_FLAGS = ["Above asking vs market", "Requires refurbishment", "High service charge", "Short lease"];
const LEVELS = ["High", "Medium", "Low"];
const RISK = ["Low", "Medium", "High"];

const APPS: Record<string, { table: string; fields: Record<string, Spec> }> = {
  suppliers: {
    table: "demo_suppliers",
    fields: {
      name: { kind: "text", max: 60, required: true },
      category: { kind: "text", max: 40, required: true },
      country: { kind: "text", max: 40, required: true },
      spend: { kind: "int", min: 0, max: 10_000_000 },
      delivery: { kind: "num", min: 0, max: 100, decimals: 2 },
      quality: { kind: "num", min: 0, max: 10, decimals: 1 },
      price_competitiveness: { kind: "enum", options: LEVELS },
      dependency_risk: { kind: "enum", options: LEVELS },
      contract_expiry: { kind: "int", min: 0, max: 120 },
      incidents: { kind: "int", min: 0, max: 50 },
      flags: { kind: "flags", options: SUPPLIER_FLAGS, maxItems: 8 },
      notes: { kind: "text", max: 400 },
    },
  },
  leads: {
    table: "demo_leads",
    fields: {
      company: { kind: "text", max: 60, required: true },
      industry: { kind: "text", max: 40, required: true },
      contact: { kind: "text", max: 60, required: true },
      lead_source: { kind: "enum", options: ["Inbound", "Outbound", "Referral", "Event"] },
      budget_gbp: { kind: "int", min: 0, max: 5_000_000 },
      timeline_months: { kind: "int", min: 0, max: 60 },
      decision_makers: { kind: "int", min: 0, max: 30 },
      previous_engagement: { kind: "text", max: 120, required: true },
      pain_point_clarity: { kind: "enum", options: LEVELS },
      fit_score: { kind: "int", min: 0, max: 100 },
      flags_str: { kind: "flagstr", options: LEAD_FLAGS, maxItems: 8 },
      notes: { kind: "text", max: 400 },
    },
  },
  properties: {
    table: "demo_properties",
    fields: {
      address: { kind: "text", max: 80, required: true },
      type: { kind: "enum", options: ["Residential Terraced", "Residential Apartment", "Commercial Unit"] },
      region: { kind: "text", max: 40, required: true },
      asking_price: { kind: "int", min: 1, max: 100_000_000 },
      estimated_market_value: { kind: "int", min: 1, max: 100_000_000 },
      monthly_rent: { kind: "int", min: 0, max: 1_000_000 },
      annual_service_charge: { kind: "int", min: 0, max: 1_000_000 },
      annual_maintenance: { kind: "int", min: 0, max: 1_000_000 },
      vacancy_risk: { kind: "enum", options: RISK },
      condition: { kind: "enum", options: ["Very Good", "Good", "Average", "Poor"] },
      title_status: { kind: "enum", options: ["Freehold", "Leasehold", "Clean Leasehold", "Short Lease"] },
      flags: { kind: "flags", options: PROPERTY_FLAGS, maxItems: 4 },
      notes: { kind: "text", max: 400 },
    },
  },
};

// Returns the cleaned value, or undefined when invalid.
// deno-lint-ignore no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
function clean(spec: Spec, value: unknown): unknown {
  switch (spec.kind) {
    case "text": {
      if (typeof value !== "string") return undefined;
      const text = value.replace(CONTROL, "").replace(/\s+/g, " ").trim();
      if (text.length > spec.max || (spec.required && text.length === 0)) return undefined;
      return text;
    }
    case "int":
      return typeof value === "number" && Number.isInteger(value) && value >= spec.min && value <= spec.max ? value : undefined;
    case "num": {
      if (typeof value !== "number" || !Number.isFinite(value) || value < spec.min || value > spec.max) return undefined;
      const f = 10 ** spec.decimals;
      return Math.round(value * f) / f;
    }
    case "enum":
      return typeof value === "string" && spec.options.includes(value) ? value : undefined;
    case "flags": {
      if (!Array.isArray(value) || value.length > spec.maxItems) return undefined;
      if (!value.every((f) => typeof f === "string" && spec.options.includes(f))) return undefined;
      return [...new Set(value as string[])];
    }
    case "flagstr": {
      if (typeof value !== "string") return undefined;
      if (value === "None") return "None";
      const parts = value.split(" | ");
      if (parts.length > spec.maxItems || !parts.every((f) => spec.options.includes(f))) return undefined;
      return [...new Set(parts)].join(" | ");
    }
  }
}

function validateRecord(app: string, record: unknown): { ok: true; row: Record<string, unknown> } | { ok: false; field: string } {
  if (!record || typeof record !== "object" || Array.isArray(record)) return { ok: false, field: "record" };
  const input = record as Record<string, unknown>;
  const row: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(APPS[app].fields)) {
    if (input[key] === undefined && spec.kind === "text" && !spec.required) { row[key] = ""; continue; }
    const value = clean(spec, input[key]);
    if (value === undefined) return { ok: false, field: key };
    row[key] = value;
  }
  return { ok: true, row };
}

// ---------------------------------------------------------------- handler

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  if (req.headers.get("origin") !== ALLOWED_ORIGIN) return respond({ error: "Forbidden origin" }, 403);
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY_BYTES) return respond({ error: "Request too large" }, 413);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return respond({ error: "Request too large" }, 413);
    body = JSON.parse(text);
  } catch {
    return respond({ error: "Invalid JSON" }, 400);
  }

  const { app, action, session, id, record } = body as { app: string; action: string; session: string; id?: string; record?: unknown };
  if (typeof app !== "string" || !Object.hasOwn(APPS, app)) return respond({ error: "Unknown app" }, 400);
  if (!["add", "update", "delete", "reset"].includes(action)) return respond({ error: "Unknown action" }, 400);
  if (typeof session !== "string" || !UUID.test(session)) return respond({ error: "Invalid session" }, 400);
  if ((action === "update" || action === "delete") && (typeof id !== "string" || !UUID.test(id))) return respond({ error: "Invalid id" }, 400);

  let row: Record<string, unknown> = {};
  if (action === "add" || action === "update") {
    const result = validateRecord(app, record);
    if (!result.ok) return respond({ error: `Invalid value for ${result.field}`, field: result.field }, 400);
    row = result.row;
  }

  const supabaseURL = Deno.env.get("SUPABASE_URL");
  const rawKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = (rawKeys ? JSON.parse(rawKeys).default : undefined) || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseURL || !serviceKey) return respond({ error: "Service unavailable" }, 503);
  const auth = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const json = { ...auth, "Content-Type": "application/json" };
  const table = APPS[app].table;
  const own = `session_id=eq.${session}`;

  // Daily write limits: per IP and global.
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const bucket = "ip:" + Array.from(new Uint8Array(hash)).map((n) => n.toString(16).padStart(2, "0")).join("");
  try {
    const q = await fetch(`${supabaseURL}/rest/v1/rpc/demo_write_consume`, {
      method: "POST", headers: json,
      body: JSON.stringify({ p_bucket: bucket, p_ip_limit: IP_DAILY_LIMIT, p_global_limit: GLOBAL_DAILY_LIMIT }),
    });
    if (!q.ok) return respond({ error: "Usage protection unavailable" }, 503);
    const verdict = await q.json();
    if (verdict === "ip") return respond({ error: "Daily limit reached for this connection. Please try again tomorrow.", code: "rate_limited" }, 429);
    if (verdict === "global") return respond({ error: "The demo has reached its daily limit. Please try again tomorrow.", code: "rate_limited" }, 429);
  } catch {
    return respond({ error: "Usage protection unavailable" }, 503);
  }

  try {
    if (action === "add") {
      const count = await fetch(`${supabaseURL}/rest/v1/${table}?${own}&select=id`, { headers: { ...auth, Prefer: "count=exact", Range: "0-0" } });
      const total = Number(count.headers.get("content-range")?.split("/")[1] ?? 0);
      if (total >= MAX_ROWS_PER_SESSION) return respond({ error: `You can add up to ${MAX_ROWS_PER_SESSION} records. Delete one or reset to sample data.`, code: "session_limit" }, 409);
      const res = await fetch(`${supabaseURL}/rest/v1/${table}`, { method: "POST", headers: { ...json, Prefer: "return=representation" }, body: JSON.stringify({ ...row, session_id: session }) });
      if (!res.ok) return respond({ error: (await res.text()).includes("session_limit") ? "Record limit reached" : "Could not save", code: "save_failed" }, res.status === 400 ? 409 : 502);
      return respond({ ok: true, row: (await res.json())[0] }, 201);
    }
    if (action === "update") {
      const res = await fetch(`${supabaseURL}/rest/v1/${table}?id=eq.${id}&${own}`, { method: "PATCH", headers: { ...json, Prefer: "return=representation" }, body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }) });
      if (!res.ok) return respond({ error: "Could not save", code: "save_failed" }, 502);
      const rows = await res.json();
      if (!rows.length) return respond({ error: "Record not found. Sample records are read-only.", code: "not_found" }, 404);
      return respond({ ok: true, row: rows[0] });
    }
    if (action === "delete") {
      const res = await fetch(`${supabaseURL}/rest/v1/${table}?id=eq.${id}&${own}`, { method: "DELETE", headers: { ...auth, Prefer: "return=representation" } });
      if (!res.ok) return respond({ error: "Could not delete", code: "save_failed" }, 502);
      if (!(await res.json()).length) return respond({ error: "Record not found. Sample records are read-only.", code: "not_found" }, 404);
      return respond({ ok: true });
    }
    // reset: remove this visitor's own rows, leaving the sample data
    const res = await fetch(`${supabaseURL}/rest/v1/${table}?${own}`, { method: "DELETE", headers: { ...auth, Prefer: "return=representation" } });
    if (!res.ok) return respond({ error: "Could not reset", code: "save_failed" }, 502);
    return respond({ ok: true, removed: (await res.json()).length });
  } catch {
    return respond({ error: "Service temporarily unavailable" }, 502);
  }
});
