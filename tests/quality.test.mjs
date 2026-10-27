// Quality checks on the static export in out/ (run after `npm run build`):
// titles, descriptions, sharing image, links, sitemap, 404, call to action,
// demo badges and the honesty rules in CLAUDE.md.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const out = fileURLToPath(new URL("../out/", import.meta.url));
const base = process.env.PAGES_PREVIEW === "true" ? "/aim-smart-solutions" : "";

const routes = [
  "", "services", "services/smart-apps", "services/ai-voice-agents",
  "services/business-automation", "services/data-analytics", "services/sales-marketing",
  "services/training", "services/ai-consultancy", "live-demos", "about", "contact",
  "book-appointment", "business-enquiry", "instant-quote", "privacy",
];

const label = (route) => route || "/";
const page = (route) => readFileSync(join(out, route, "index.html"), "utf8");
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1].replace(/&amp;/g, "&"));

test("every page has a unique title and meta description", () => {
  const titles = new Map();
  const descriptions = new Map();
  for (const route of routes) {
    const html = page(route);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title, `${label(route)} has no title`);
    assert.ok(description && description.length >= 50, `${label(route)} has no useful meta description`);
    assert.ok(!titles.has(title), `${label(route)} repeats the title of ${titles.get(title)}`);
    assert.ok(!descriptions.has(description), `${label(route)} repeats the description of ${descriptions.get(description)}`);
    titles.set(title, label(route));
    descriptions.set(description, label(route));
  }
});

test("every page has an Open Graph image and a canonical URL", () => {
  for (const route of routes) {
    const html = page(route);
    assert.match(html, /<meta property="og:image" content="https:\/\/aimsmartsolutions\.tech\/og-v2.png"/, `${label(route)} has no og:image`);
    assert.match(html, /<link rel="canonical" href="https:\/\/aimsmartsolutions\.tech\//, `${label(route)} has no canonical URL`);
  }
  assert.ok(existsSync(join(out, "og-v2.png")), "og-v2.png is missing");
});

test("internal links and images all point at files that exist", () => {
  const missing = [];
  for (const route of [...routes, "404"]) {
    const html = route === "404" ? readFileSync(join(out, "404.html"), "utf8") : page(route);
    const targets = [...all(html, /<a [^>]*href="([^"]+)"/g), ...all(html, /<img [^>]*src="([^"]+)"/g)];
    for (const target of targets) {
      if (!target.startsWith("/") || target.startsWith("//")) continue;
      let path = target.split(/[?#]/)[0];
      if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
      const file = path.endsWith("/") ? join(out, path, "index.html") : join(out, path);
      if (!existsSync(file)) missing.push(`${label(route)} -> ${target}`);
    }
  }
  assert.deepEqual(missing, [], `broken internal links or images:\n${missing.join("\n")}`);
});

test("sitemap, robots.txt and a custom 404 page exist", () => {
  const sitemap = readFileSync(join(out, "sitemap.xml"), "utf8");
  for (const route of routes) {
    const loc = `<loc>https://aimsmartsolutions.tech/${route ? route + "/" : ""}</loc>`;
    assert.ok(sitemap.includes(loc), `sitemap is missing ${label(route)}`);
  }
  assert.match(readFileSync(join(out, "robots.txt"), "utf8"), /Sitemap: https:\/\/aimsmartsolutions\.tech\/sitemap\.xml/);
  assert.match(readFileSync(join(out, "404.html"), "utf8"), /could not find/);
});

test("every page offers the one main call to action", () => {
  const cta = new RegExp(`href="${base}/book-appointment/"[^>]*>Book a Free AI Opportunity Call`);
  for (const route of routes) assert.match(page(route), cta, `${label(route)} lacks the main call to action`);
});

test("every demo in the AI Lab has a Live or Illustrative data badge", () => {
  const tiles = page("live-demos").split('class="demo-tile"').slice(1);
  assert.ok(tiles.length >= 9, `expected at least 9 demos, found ${tiles.length}`);
  tiles.forEach((tile, i) => assert.match(tile.slice(0, 300), /class="demo-badge [^"]+">(Live|Illustrative data)</, `demo ${i + 1} has no badge`));
});

test("honesty rules: no testimonials, client logos, savings figures or performance claims", () => {
  for (const route of routes) {
    const text = page(route).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(text, /testimonial|what our clients say|trusted by|client logos?|case stud/i, `${label(route)} looks like it has testimonials or client logos`);
    assert.doesNotMatch(text, /(sav(e|ed|ing)|cut|reduc(e|ed)|increas(e|ed)|boost(ed)?) [^.]{0,30}\d+ ?(%|per ?cent|hours|x\b)/i, `${label(route)} contains a savings or performance figure`);
    assert.doesNotMatch(text, /guaranteed (results|growth|savings)/i, `${label(route)} promises guaranteed results`);
  }
});

test("every form links to the privacy policy", () => {
  for (const route of ["business-enquiry", "instant-quote", "book-appointment", "services/sales-marketing"]) {
    assert.match(page(route), /class="privacy-note"[^]*?href="(\/aim-smart-solutions)?\/privacy\/"/, `${route} has no privacy link under its form`);
  }
  assert.match(page("privacy"), /Draft for owner review/, "privacy policy draft note missing");
});
