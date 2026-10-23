# Decisions

Lasting decisions for the AIM Smart Solutions website. Newest last. Add to this file rather
than rewriting history; if a decision changes, add a new entry that replaces the old one.

## Hosting and build
- **Static export on GitHub Pages.** `next build` writes `out/`; `.github/workflows/pages.yml`
  deploys it on every push to `main`. Live at https://aimsmartsolutions.tech (DNS switched
  2026-10-22). `PAGES_PREVIEW=true` builds for the old github.io preview path.
- **Trailing slashes.** Every route is a folder (`/about/`), so internal links end in `/`.
- **Pull requests are checked** by `.github/workflows/ci.yml` (lint, build, tests).

## Forms and back end
- **Forms call Supabase Edge Functions directly** from the browser with the public anon key:
  `submit-enquiry` (enquiry), `save-service-request` (instant quote), `appointment-booking`
  (availability and booking). Secrets live only in Supabase function settings.
- **`save-business-enquiry` and `vapi-outbound-call` are frozen** copies of deployed versions
  used by the old site. Never change or redeploy them.
- **Spam protection:** a hidden honeypot field (`website`) on every form, daily limits in
  `submit-enquiry`, and Cloudflare Turnstile once its keys are added.
- **The AI call-back is off** until Turnstile keys are added. Without a site key the enquiry
  form shows no Urgent option, and the site must not describe the call as working.
- **AI call cost caps** (in `submit-enquiry`, table `call_log`, function `call_claim`): each
  call lasts at most 180 seconds; at most 10 calls a UTC day site-wide, one per number in any
  24 hours, two per IP a day, UK (+44) numbers only. Over a cap there is no call, but the
  enquiry is still saved and both emails still go.
- **Emails** are sent through IONOS SMTP from enquiry@aimsmartsolutions.tech. Delivery can be
  checked read-only with `npm run check-test-emails`.

## Site structure and content (2026-10-22)
- **Three pillars** organise the services. Service URLs do not change.
  - Win More Customers: AI Voice Agents, AI Sales & Marketing.
  - Save Time: Business Process Automation, AI Smart Apps.
  - Decide Better: Data & Dashboards, AI & Data Training, AI Consultancy.
- **One main call to action:** "Book a Free AI Opportunity Call" → `/book-appointment/`.
- **Demo badges:** every demo is labelled "Live" (works for real) or "Illustrative data"
  (fictional sample data).
- **Built-in demos run in the browser only** and store nothing.
- **Honesty rules:** no testimonials, client logos, savings figures or performance claims,
  and no invented facts.
- **Founder name on the site:** Alaa Mostafa (PhD in Semiconductor Physics).

## Quality (2026-10-22)
- **Automated checks** in `tests/quality.test.mjs` run on every PR: unique titles and meta
  descriptions, Open Graph image and canonical URL on every page, no broken internal links or
  images, sitemap, robots.txt, custom 404, the main call to action on every page, demo badges
  and the honesty rules.
- **Images** are small WebP files (`aim-logo.webp`, `alaa-mostafa.webp`); the sharing image is
  an AIM-branded `og.png` (1200×630).
- **Performance:** accessibility and SEO score 100. Mobile performance is limited mainly by the
  Next.js/React JavaScript every page loads; inlining CSS was tried and made it worse, so it
  is off.

## External demo apps (2026-10-22)
- Four demo apps live in their own `aidemolab` repos and deploy to `aidemolab.github.io/<repo>/`
  with a Pages workflow: pharma, `aim-supplier-risk-demo` (Data & Dashboards),
  `aim-sales-lead-scoring-demo` (Sales & Marketing) and `aim-property-investment-demo`
  (Smart Apps). The main site only links to them, badge "Illustrative data".
- They contain no API keys and no server code; any "AI" behaviour is rule-based and labelled so.
- The property demo carries "Not investment advice" and uses clearly fictional addresses.
- The demo repos are also edited in Google AI Studio (two-way sync), so keep changes small
  and expect AI Studio commits on `main`.
- The in-site Business Performance Dashboard was removed in favour of the Supplier Risk app.

## Live database for the data demos (2026-10-22)
- The three data apps (Supplier Risk, Sales Lead Scoring, Property Investment) run on a live
  database in the **AIM Pharmaceutical AI Demo** Supabase project (`xlxyphqzdzhipmllhxaq`),
  never the customer project. Source: `demo-apps-backend/` (schema, seed data, Edge Function).
- Each browser gets a random session id (localStorage). Visitors see the sample rows plus their
  own, can add, edit and delete their own rows (max 50 per table) and reset to the sample data.
  Sample rows are read-only. Rows older than 24 hours are deleted hourly (pg_cron).
- Reads use Row Level Security (the `x-demo-session` header). All writes go through one Edge
  Function (`demo-data`): origin lock to `https://aidemolab.github.io`, field validation and size
  limits, and a daily limit per IP (120) and overall (3000). No secret keys are in browser code.
- Main-site badge for these three apps is **Live**; the pharma app stays **Illustrative data**.
  Every app says the sample data is fictional and not to enter personal or confidential data.

## Appointment reminders (2026-10-22)
- `send-appointment-reminders` requires the `x-cron-secret` header (Supabase secret
  `REMINDERS_CRON_SECRET`, same value in Vault as `reminders_cron_secret`); no JWT.
- pg_cron job `appointment-reminders-hourly` (minute 5) calls it via pg_net. One customer and one
  business reminder per appointment, sent when the appointment is 2 to 24 hours away; each flag is
  claimed before sending (no duplicates) and released if sending fails.

## Demo video files (2026-10-23)
- Every demo video and poster in `public/assets/videos/` has its version in the file name
  (e.g. `pharma-demo-v5.mp4`, `pharma-demo-v5-poster.jpg`, `supplier-risk-v2.mp4`), so browsers
  and the CDN never serve a cached older cut. A new cut gets a new name; old names are removed.

## Keyword demo: real UK trend data (2026-10-23)
- The AI Content & Keyword Generator first calls the `keyword-trends` Edge Function (demo project
  `xlxyphqzdzhipmllhxaq`, no JWT): Google Trends related queries via Firecrawl (`firecrawl-trends`,
  geo GB, last 12 months), seeded with the visitor's business type. Source:
  `demo-apps-backend/supabase/functions/keyword-trends/` and `keyword_trends.sql`.
- Noise is removed before showing: a blocklist (brands, retailers, closures, news, jobs, courses)
  plus one AI pass that keeps only generic, commercially useful phrases. The filtered phrases are
  passed to `content-generator` as `trendKeywords` and shape the keyword ideas and posts.
- Shown as "UK search popularity (0-100, last 12 months)" and "Rising searches", labelled as
  popularity scores, never search volumes.
- Protection: origin lock, 20 lookups per IP per UTC day, each seed cached 24 hours in
  `keyword_trends_cache`, at most 100 Firecrawl calls per UTC day. On any failure or the cap the
  page falls back to AI-only keyword ideas with a short note. `FIRECRAWL_API_KEY` lives only as a
  Supabase secret in the demo project.
