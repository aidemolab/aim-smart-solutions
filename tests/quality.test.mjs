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
  "services/training", "services/ai-consultancy",
  "services/video-production", "services/course-design",
  "services/win-more-customers", "services/save-time", "services/decide-better", "services/train-your-team", "live-demos", "about", "contact",
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
    assert.match(html, /<meta property="og:image" content="https:\/\/aimsmartsolutions\.tech\/og-v3.png"/, `${label(route)} has no og:image`);
    assert.match(html, /<link rel="canonical" href="https:\/\/aimsmartsolutions\.tech\//, `${label(route)} has no canonical URL`);
  }
  assert.ok(existsSync(join(out, "og-v3.png")), "og-v3.png is missing");
  assert.ok(existsSync(join(out, "og-v2.png")), "og-v2.png must stay so old shared links still work");
});

const hasId = (html, id) => html.includes(`id="${id}"`);

test("internal links and images all point at files that exist", () => {
  const missing = [];
  for (const route of [...routes, "404"]) {
    const html = route === "404" ? readFileSync(join(out, "404.html"), "utf8") : page(route);
    const targets = [...all(html, /<a [^>]*href="([^"]+)"/g), ...all(html, /<img [^>]*src="([^"]+)"/g)];
    for (const target of targets) {
      // Same-page anchors must exist on this page.
      if (target.startsWith("#")) {
        if (target.length > 1 && !hasId(html, target.slice(1))) missing.push(`${label(route)} -> ${target} (no such anchor)`);
        continue;
      }
      if (!target.startsWith("/") || target.startsWith("//")) continue;
      let path = target.split(/[?#]/)[0];
      if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
      const file = path.endsWith("/") ? join(out, path, "index.html") : join(out, path);
      if (!existsSync(file)) { missing.push(`${label(route)} -> ${target}`); continue; }
      // Links to an anchor on another page must land on an element with that id.
      const hash = target.split("#")[1];
      if (hash && !hasId(readFileSync(file, "utf8"), hash)) missing.push(`${label(route)} -> ${target} (no such anchor)`);
    }
  }
  assert.deepEqual(missing, [], `broken internal links or images:\n${missing.join("\n")}`);
});

test("every service is linked from its pillar page and the Services menu", () => {
  const pillarIds = ["win-more-customers", "save-time", "decide-better", "train-your-team"];
  const serviceRoutes = routes.filter((route) => route.startsWith("services/") && !pillarIds.includes(route.slice(9)));
  const menu = page("").match(/<div class="services-menu">([^]*?)<\/div><\/div>/)?.[1] ?? "";
  for (const route of serviceRoutes) {
    const href = `href="${base}/${route}/"`;
    assert.ok(menu.includes(href), `${route} is missing from the Services menu`);
    const crumb = page(route).match(/class="breadcrumbs"[^]*?<\/nav>/)?.[0] ?? "";
    const pillar = pillarIds.find((id) => crumb.includes(`href="${base}/services/${id}/"`));
    assert.ok(pillar, `${route} breadcrumb does not link to a pillar page`);
    assert.ok(page(`services/${pillar}`).includes(`class="pillar-service-card" ${href}`) || page(`services/${pillar}`).includes(href), `${route} is not linked from /services/${pillar}/`);
    assert.match(page(route), /"@type":"BreadcrumbList"/, `${route} has no BreadcrumbList JSON-LD`);
  }
  // Contact section pages keep their URLs and show Home › Contact › page, a back link and JSON-LD.
  for (const route of ["book-appointment", "business-enquiry", "instant-quote"]) {
    const html = page(route);
    const crumb = html.match(/class="breadcrumbs"[^]*?<\/nav>/)?.[0] ?? "";
    assert.ok(crumb.includes(`href="${base}/contact/"`), `${route} breadcrumb does not go through Contact`);
    assert.match(html, /class="back-to-contact"[^>]*>[^]*?Back to Contact/, `${route} has no Back to Contact link`);
    assert.match(html, /"@type":"BreadcrumbList"[^<]*"name":"Contact"/, `${route} JSON-LD does not match the breadcrumb`);
  }
  for (const id of pillarIds) {
    assert.match(page(`services/${id}`), /"@type":"BreadcrumbList"/, `${id} has no BreadcrumbList JSON-LD`);
    assert.ok(page("").includes(`href="${base}/services/${id}/"`), `homepage does not link to ${id}`);
  }
});

test("sitemap, robots.txt and a custom 404 page exist", () => {
  const sitemap = readFileSync(join(out, "sitemap.xml"), "utf8");
  // /live-demos/ is only a redirect to /services/, so it is left out of the sitemap.
  for (const route of routes.filter((r) => r !== "live-demos")) {
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

test("\"practical\" is not used anywhere on the site", () => {
  for (const route of [...routes, "404"]) {
    const html = route === "404" ? readFileSync(join(out, "404.html"), "utf8") : page(route);
    assert.doesNotMatch(html, /practical/i, `${label(route)} still says "practical"`);
  }
});

test("/services/ shows each service's demo videos, with no try buttons or contact pages", () => {
  const html = page("services");
  const main = html.slice(html.indexOf('class="pillar-section"'), html.indexOf('class="services-cta"'));
  const cards = main.split('class="services-list-card service-video-card"').slice(1);
  assert.equal(cards.length, 9, `expected 9 service cards, found ${cards.length}`);
  // Exactly the agreed videos per service (Course Design & Build points to the Skills Taster).
  const expected = { "ai-voice-agents": ["voice-agents-v1"], "sales-marketing": ["keywords-demo-v1"], "video-production": ["showreel-v2"],
    "business-automation": ["automation-demo-v1"], "smart-apps": ["pharma-demo-v5"], "data-analytics": ["supplier-risk-v2", "sales-leads-v2", "property-v2"],
    "ai-consultancy": ["consultancy-demo-v1"], training: ["training-demo-v1"], "course-design": ["training-demo-v1"] };
  for (const [slug, videos] of Object.entries(expected)) {
    const card = main.slice(main.indexOf(`id="service-${slug}"`), main.indexOf("</article>", main.indexOf(`id="service-${slug}"`)));
    const found = [...card.matchAll(/data-video="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(found, videos, `/services/ ${slug} shows ${found.join(", ") || "no videos"}`);
    // The service page shows the same videos.
    const onPage = [...new Set([...page(`services/${slug}`).matchAll(/data-video="([^"]+)"/g)].map((m) => m[1]))];
    assert.deepEqual(onPage.sort(), [...videos].sort(), `/services/${slug}/ shows ${onPage.join(", ")}`);
  }
  for (const id of ["win-more-customers", "save-time", "decide-better", "train-your-team"]) assert.ok(html.includes(`id="${id}"`), `#${id} anchor missing`);
  assert.doesNotMatch(main, /class="demo-try"|class="demo-badge|Generate content|Get your score|Start the taster|Try it →/, "a try button or badge is on /services/");
  assert.doesNotMatch(main, /Enquiry journey|Instant quote request|Online booking/, "a contact page is shown as a demo");
  assert.doesNotMatch(main, /href="(\/aim-smart-solutions)?\/(business-enquiry|instant-quote|book-appointment)\/"/, "/services/ links to a contact page as a demo");
});

test("/live-demos/ only redirects to /services/, and nothing links to it", () => {
  const html = page("live-demos");
  assert.match(html, /http-equiv="refresh" content="0; url=(\/aim-smart-solutions)?\/services\/"/, "no meta refresh to /services/");
  assert.match(html, /<meta name="robots" content="noindex, follow"/, "redirect page should not be indexed");
  for (const route of [...routes.filter((r) => r !== "live-demos"), "404"]) {
    const other = route === "404" ? readFileSync(join(out, "404.html"), "utf8") : page(route);
    assert.doesNotMatch(other, /href="(\/aim-smart-solutions)?\/live-demos\//, `${label(route)} still links to /live-demos/`);
  }
  assert.doesNotMatch(readFileSync(join(out, "sitemap.xml"), "utf8"), /live-demos/, "sitemap still lists /live-demos/");
});

test("the shared demo bar sends visitors back to AIM, not to the old Live demos page", () => {
  const bar = readFileSync(join(out, "assets", "aim-demo-bar.js"), "utf8");
  assert.doesNotMatch(bar, /live-demos/, "aim-demo-bar.js still links to /live-demos/");
  assert.match(bar, /Back to AIM Smart Solutions/, "aim-demo-bar.js has no 'Back to AIM Smart Solutions' link");
  for (const app of ["aim-sales-lead-scoring-demo", "aim-property-investment-demo", "aim-supplier-risk-demo"]) {
    assert.ok(new RegExp(`id: "${app}"[^}]*serviceUrl: SITE [+] "/services/data-analytics/"`).test(bar), `${app} should go back to Data & Dashboards`);
  }
  assert.match(bar, /id: "aim-pharmaceutical-ai-demo"[^}]*serviceUrl: SITE \+ "\/services\/smart-apps\/"/, "pharma app should go back to AI Smart Apps");
});

test("link rules: other websites and form links open in a new tab with a label; other links to our pages, demo apps, mailto and tel do not", () => {
  const ours = /^(\/|#|https:\/\/aimsmartsolutions\.tech|https:\/\/aidemolab\.github\.io\/)/;
  for (const route of [...routes, "404"]) {
    const html = route === "404" ? readFileSync(join(out, "404.html"), "utf8") : page(route);
    const forms = [...html.matchAll(/<form[\s>][\s\S]*?<\/form>/g)].map((m) => [m.index, m.index + m[0].length]);
    for (const m of html.matchAll(/(<a\s[^>]*>)([\s\S]*?)<\/a>/g)) {
      const [, tag, body] = m;
      const href = tag.match(/href="([^"]*)"/)?.[1] ?? "";
      const where = `${label(route)}: ${href}`;
      // Exception: links inside a form, or directly under one (class "form-link"), open in a new tab.
      const formLink = /class="[^"]*\bform-link\b/.test(tag) || forms.some(([a, b]) => m.index > a && m.index < b);
      if (/^(mailto|tel):/.test(href)) {
        assert.ok(!/target=/.test(tag), `${where} should have no target`);
      } else if (ours.test(href) && !formLink) {
        assert.ok(!/target=/.test(tag), `${where} should open in the same tab`);
      } else {
        assert.match(tag, /target="_blank"/, `${where} should open in a new tab`);
        assert.match(tag, /rel="noopener noreferrer"/, `${where} needs rel="noopener noreferrer"`);
        // Footer social icons are icon-only, so they carry an accessible label instead of the ↗.
        if (!/class="footer-social-link"/.test(tag)) assert.match(body, /↗/, `${where} needs the ↗ icon`);
        assert.match(body, /\(opens in a new tab\)/, `${where} needs "(opens in a new tab)"`);
      }
    }
  }
});

test("privacy links under forms open in a new tab", () => {
  for (const route of ["book-appointment", "business-enquiry", "instant-quote", "services/sales-marketing"]) {
    const note = page(route).match(/<p class="privacy-note">[\s\S]*?<\/p>/)?.[0];
    assert.ok(note, `${route} has no privacy note`);
    assert.match(note, /class="external-link form-link" target="_blank"|target="_blank"[^>]*form-link/, `${route}: the privacy link should open in a new tab`);
  }
});

test("the footer links to AIM on LinkedIn and Facebook, in a new tab, on every page", () => {
  const social = [
    ["https://www.linkedin.com/company/aimsmartsolutionsuk/", "AIM Smart Solutions on LinkedIn"],
    ["https://www.facebook.com/aimsmartsolutions.tech", "AIM Smart Solutions on Facebook"],
  ];
  for (const route of routes) {
    const footer = page(route).match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
    for (const [href, name] of social) {
      const at = footer.indexOf(`href="${href}"`);
      const link = at < 0 ? undefined : footer.slice(footer.lastIndexOf("<a", at), footer.indexOf("</a>", at) + 4);
      assert.ok(link, `${label(route)}: footer has no link to ${href}`);
      assert.match(link, /target="_blank"/, `${label(route)}: ${name} should open in a new tab`);
      assert.match(link, /rel="noopener noreferrer"/, `${label(route)}: ${name} needs rel="noopener noreferrer"`);
      assert.ok(link.includes(`${name} (opens in a new tab)`), `${label(route)}: ${name} needs its label and "(opens in a new tab)"`);
      assert.match(link, /<svg[^>]*aria-hidden="true"/, `${label(route)}: ${name} needs its icon`);
    }
  }
});
