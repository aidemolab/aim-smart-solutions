// Checks the static export in out/ after `npm run build`.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const out = fileURLToPath(new URL("../out/", import.meta.url));

const routes = [
  "", "services", "services/smart-apps", "services/ai-voice-agents",
  "services/business-automation", "services/data-analytics", "services/sales-marketing",
  "services/training", "services/ai-consultancy", "live-demos", "about", "contact",
  "book-appointment", "business-enquiry", "instant-quote",
];

function allFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
}

test("every required route is exported as a static page", () => {
  for (const route of routes) {
    const file = join(out, route, "index.html");
    assert.ok(existsSync(file), `missing ${route || "/"} -> ${file}`);
    assert.match(readFileSync(file, "utf8"), /<html lang="en-GB"/, `${route} is not a full page`);
  }
  assert.ok(existsSync(join(out, "404.html")), "missing 404.html");
});

test("no server-only leftovers in the export", () => {
  const text = allFiles(out).filter((f) => /\.(html|js|txt)$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
  assert.doesNotMatch(text, /\/api\/(calls|appointments|service-request)/, "a page still calls an old API route");
  assert.doesNotMatch(text, /codex-preview/, "ChatGPT Sites preview meta tag is still present");
  assert.doesNotMatch(text, /utm_source=chatgpt\.com/, "ChatGPT tracking link found");
  assert.doesNotMatch(text, /service_role|IONOS_SMTP|VOICE_AGENT|BOOKING_SECRET/, "a secret name leaked into browser code");
});

test("consent wording in the form matches the wording the function stores", () => {
  const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
  const client = read("../lib/consent.ts");
  const server = read("../supabase/functions/submit-enquiry/index.ts");
  const version = client.match(/CALL_CONSENT_VERSION = "([^"]+)"/)?.[1];
  const text = client.match(/CALL_CONSENT_TEXT =\s*"([^"]+)"/)?.[1];
  assert.ok(version && text, "could not read lib/consent.ts");
  assert.ok(server.includes(`"${version}":\n    "${text}"`), `submit-enquiry has no identical wording for version ${version}`);
});
