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
- **Old-site functions removed** (2026-10-24): `save-business-enquiry`, `vapi-outbound-call`
  and `test-ionos-smtp` served only the old ChatGPT Sites version and are deleted from Supabase.
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
  an AIM-branded `og-v2.png` (1200×630; renamed from `og.png` so LinkedIn and others refetch it).
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

## AI Voice Agents explainer video (2026-10-24)
- The AI Voice Agents page has an animated concept explainer (`voice-agents-v1`), not a recording:
  the calls are simulated chat bubbles on a phone, marked "Illustrative example" on screen. It is
  labelled "Watch the 1-minute explainer" on the service page and in the `/services/` pop-up.
- Source: `video/voice-agents/scenes.html` (drawn by `render(t)`), captured frame by frame by
  `video/voice-agents/capture.cjs`, then finished with `video/finish.py` (Jamie voiceover, captions,
  end card with `--card-head` and `--card-site`). Lines: `video/voice-agents/lines.txt`.

## Business Process Automation demo video (2026-10-24)
- The Business Process Automation page features `automation-demo-v1` (set as the enquiry-journey
  demo's `video`, so it shows on the service page and in the `/services/` pop-up).
- S3 records the real `/business-enquiry/` page, but on a local build with Cloudflare's invisible
  always-pass test Turnstile key, and the `submit-enquiry` call is answered with the live
  function's exact success response. The live form is behind Turnstile, which an automated
  browser must not get past, so no real enquiry is saved and no email is sent while recording.
  The steps panel shows only what `submit-enquiry` really does (save, customer email, owner
  email) with its real subjects and wording.
- Source: `video/automation/` (`scenes.html` + `capture.cjs` for S1, S2 and S4, `record.cjs` for
  S3, `assemble.sh` to join them, `lines.txt` for `video/finish.py`).

## Video Production and Course Design & Build services (2026-10-27)
- Two services added, now nine: **Video Production** (Win More Customers, after AI Sales & Marketing)
  and **Course Design & Build** (Decide Better, after AI & Data Training). Each pillar gained one
  "pain" line.
- Video Production's proof is the existing AIM videos (`videoExamples` in `lib/demos.ts`), labelled
  as an animated explainer or demo walkthroughs. They are our own demos, not client work.
- Course Design & Build links the existing AI Skills Taster demo. "More than 20 years in education
  and training" is the owner's own statement; the site gives no other figures or client names.

## Four pillars and pillar pages (2026-10-30)
- The services are now grouped into four pillars: Win More Customers, Save Time, Decide Better and
  **Train Your Team**. Train Your Team holds AI & Data Training and Course Design & Build, which
  move out of Decide Better (this replaces the grouping in the 2026-10-27 entry). Decide Better
  keeps Data & Dashboards and AI Consultancy.
- Why: training is AIM's differentiator. Not every builder is a trainer; AIM builds the solution
  and makes sure the team can use it, so training gets its own pillar instead of sitting inside
  Decide Better.
- Train Your Team's copy reuses existing wording only: promise "Help your team use AI with
  confidence"; the intro and its two pain lines come from Decide Better's old copy.
- Structure: Home → pillar pages → service pages. Pillar pages are `/services/<pillar-id>/`
  (generated by `app/services/[slug]/page.tsx` with `app/services/PillarPage.tsx`), each with
  its own title, description, og-v2.png and BreadcrumbList JSON-LD, and listed in the sitemap.
- Homepage pillar cards have one link each, the pillar title, to its pillar page. Services on the
  card are plain text, so each card has exactly one link.
- Service page breadcrumb: Home › Pillar › Service, the pillar linking to its pillar page, with
  matching BreadcrumbList JSON-LD. "Also in [pillar]" is unchanged.
- The Services menu, the footer columns and the Live demos sections link pillar headings to the
  pillar pages. Live demos are grouped by pillar; a demo used by two pillars (the enquiry
  journey) appears under both.
- `/services/` stays as the overview, each pillar section links to its pillar page, and the
  `#win-more-customers`, `#save-time`, `#decide-better` (and new `#train-your-team`) anchors work.
- `tests/quality.test.mjs` checks every internal link and `#anchor` in the export, and that each
  service is linked from its pillar page and the Services menu.

## Homepage sections moved; Live demos by service (2026-10-30)
- The homepage now runs: hero, pillar cards, "A strong fit?", FAQ, call to action. Its "See the
  solutions working" button goes to the live journeys on the AI Voice Agents page.
- AI Voice Agents tells one story: the pain ("The cost of waiting"), what the service does, the
  offer ("The AI Receptionist package", which names what the package adds rather than repeating
  the page), the proof (the explainer video and the three live journeys: instant response,
  quotation-ready request, booking), then the booking call to action. Its `demos` list is those
  three journeys.
- Business Process Automation already shows the quotation-ready journey as its "Instant quote
  request" demo.
- "How I work" lives only on the About page, reworded as "How we work" (AIM).
- About page: the "See it working before you decide" section is removed and the closing call to
  action is "Talk to us". "AI Lab" is no longer used anywhere; the page is "Live demos".
- `/live-demos/` is organised by service, in pillar order, with a pillar label above each group and
  a quick-jump list at the top. Each service shows the demos from its own "Try it" section
  (`service.demos`). The three journeys appear under both AI Voice Agents and Business Process
  Automation because both pages use them. Video Production shows its video examples; Course
  Design & Build points to the AI Skills Taster under AI & Data Training instead of repeating it.

## Contact section (2026-10-30)
- `/book-appointment/`, `/business-enquiry/` and `/instant-quote/` belong to the Contact section
  but keep their URLs (the booking link is shared on LinkedIn), so no redirects are needed.
- Each shows "← Back to Contact", the breadcrumb Home › Contact › page, and matching BreadcrumbList
  JSON-LD (`app/components/ContactCrumbs.tsx`). "Contact" is highlighted in the desktop and mobile
  menus on all four Contact pages.
- The booking page says "Talk directly with the person who builds your solution, not a sales team".

## Homepage trimmed; FAQ on Contact; no header booking button on the booking page (2026-10-30)
- The homepage is exactly: hero, the four pillar cards, footer. The reasons strip, "Explore all
  services / Try the live demos" line, "A strong fit?" and the closing call to action are removed.
  "A strong fit?" is dropped because About's "Who AIM works with" already says the same.
- The FAQ ("Clear answers. No hard sell.") moves to the Contact page, below the three contact
  options, so people see it before they book.
- The header "Book a Free AI Opportunity Call" button (top bar and mobile menu) is hidden on
  `/book-appointment/` only, where it would reload the same page.

## New hero, "practical" retired, og-v3 share image (2026-10-30)
- Homepage hero eyebrow: "Smart AI solutions that help businesses grow" (changed 2026-10-31); headline "AI that grows
  your business. Built for you. Taught to you."; the four-pains subheading; buttons "Book a Free AI
  Opportunity Call" (/book-appointment/) and "Try a live demo" (/live-demos/); the three ticks.
- The hero is text-only. The planned promo video (aim-promo-v2) was not available to check, so it is
  not embedded; any promo video must first be checked for out-of-date wording ("practical", three
  pains/pillars) or footage of the old site.
- The pillar section and /services/ heading now say "four everyday pains", matching the hero.
- "Practical" is no longer used anywhere on the site, as branding or as ordinary English; a test
  fails if it returns.
- Share image: every page uses `og-v3.png` (new tagline). `og-v2.png` stays in `public/` so old
  shared links keep their image.

## New pages open at the top (2026-10-30)
- Clicking through to a pillar, service or Contact page opened it scrolled down, with the breadcrumb
  under the sticky header. Two causes: `html{scroll-behavior:smooth}` without Next.js's
  `data-scroll-behavior="smooth"` opt-in (Next's scroll-to-top animated, then it scrolled the new
  content to the window top, under the header), and Next keeping the old position after a small
  scroll.
- Fix: `data-scroll-behavior="smooth"` on `<html>`, and `app/components/ScrollToTop.tsx`, which
  scrolls to the top after each page change except `#anchor` links and Back/Forward (so Back still
  returns to where the visitor was).

## /services/ is the overview and video page; Live demos removed (2026-10-30)
- Replaces the Live demos layouts above. `/services/` shows the four pillars in order (number,
  title linking to the pillar page, tagline, pain lines), then each service: name, one-line
  description, its demo video(s) as "Watch the demo video" buttons (pop-up player), and
  "Explore [service] →". No try buttons, forms, contact pages or badges here: these are videos,
  and each service page keeps its own badged, interactive demo. Course Design & Build points to the
  AI Skills Taster video under AI & Data Training. Videos per service: `serviceVideos` in
  `lib/demos.ts`.
- The enquiry, quote and booking pages are AIM's real contact pages, not demos.
- `/live-demos/` is only a redirect to `/services/` (instant in the browser, with a meta refresh
  without JavaScript; old `#demos-<service>` anchors land on `#service-<service>`). It is not in the
  sitemap, is marked noindex, and nothing links to it. "Live demos" is gone from the menus, footer
  and 404 page; the hero's "Try a live demo" button goes to `/services/`.

## Site audit: one job per service, demos and videos (2026-10-30)
- Contact forms (enquiry, quote, booking) are never shown as demos: the AI Voice Agents journey
  cards and the Business Process Automation enquiry journey are gone, and the enquiry and quote
  pages no longer call themselves demonstrations.
- One job per service: Voice Agents = calls (its cost-of-waiting points are all about calls); Sales
  & Marketing = getting found (content, keywords, social posts); Business Process Automation = admin
  workflows; Smart Apps = tools that save your team time; Data & Dashboards = your numbers;
  Consultancy = where AI helps; Training and Course Design = skills. Win More Customers and Save Time
  pain lines follow these jobs.
- Demos and videos per service live in `serviceVideos` (`lib/demos.ts`), used by both /services/ and
  the service pages, so they always match: Voice Agents explainer; Content & Keyword Generator (video
  + built-in tool); Video Production showreel; BPA demo video; Pharmaceutical app (video + Try it);
  Data & Dashboards: Supplier Risk, Sales Lead Scoring and Property Investment (video + Try it each);
  Opportunity Score (video + built-in tool); Skills Taster (Course Design points to it). Sales Lead
  Scoring and Property Investment moved to Data & Dashboards.
- Video Production's showreel (`showreel-v2`, 34 s, 16:9 and `showreel-v2-1x1` 1:1; see "Showreel v2"
  below) replaced the silent `showreel-v1`.
- Every service page: hero → how it helps → benefits → use cases and what's included → demo →
  "Could [service] help?" → "Also in [pillar]" → previous/next. The hero button always scrolls to
  #demo ("Try the live demo", or "Watch the demo" on video-only pages). AI Voice Agents keeps its
  cost-of-waiting opener and the AI Receptionist offer before the demo.
- Positioning: "solo traders and small businesses" replaces "UK service businesses", "SMEs" and
  "small and growing service businesses".
- The shared demo bar (`public/assets/aim-demo-bar.js`) says "← Back to AIM Smart Solutions" and
  goes to each app's service page; "All services and demos" goes to /services/.
- Homepage only: the header "Book a Free AI Opportunity Call" fades out while the hero's own booking
  button is on screen and returns once the visitor scrolls past it (hidden from clicks and
  keyboard while faded). The hero's secondary button is "Watch our demos →" (/services/).

## Final fixes from the screenshot review (2026-10-30)
- Contact forms use real-form wording: the enquiry button is "Send my enquiry".
- The quote form lists the nine services grouped by pillar, plus "Not sure yet / something else".
  The names are sent as they appear, so the quote emails show them. At most 6 can be chosen,
  because the save-service-request function keeps 6 services per request.
- Booking: the first availability request after a quiet spell can take over 10 seconds (the
  Google Apps Script calendar behind GOOGLE_BOOKING_URL warms up). After 8 seconds, or on failure,
  the page shows "We couldn't load the available times. Please try again or email
  enquiry@aimsmartsolutions.tech." with a "Try again" button; times that arrive later still appear.
- Course Design & Build shows the AI Skills Taster video on its page and its /services/ card.
  Video Production's button is "Watch our showreel".
- Every demo video has a branded cover (AIM logo, service, title, a subtitle for that service).
- Header booking button reads "Book a call" under 768px wide. Homepage pillar cards have the same
  spacing around the divider. Form text areas use the site font.

## Booking kept warm; quote form takes all 10 options (2026-10-30)
- `.github/workflows/warm-booking.yml` asks the appointment-booking function for available times
  every 10 minutes between 07:00 and 22:00 UK time, so the Google Apps Script calendar behind it
  stays warm and the first visitor's load is about 2 seconds. It uses only the public Supabase URL
  and anon key; a slow or failed call logs a warning instead of failing.
- Booking page: after 8 seconds it shows "Still loading available times…" with the email address
  below; times still appear when they arrive. "We couldn't load the available times" and "Try
  again" appear only when the request actually fails.
- `save-service-request` (Supabase, version 17) now keeps up to 10 services per request, so the
  quote form has no limit: all nine services plus "Not sure yet" can be chosen.

## Location only in the footer and on Contact (2026-10-31)
- "Bolton, Greater Manchester" appears only in the site-wide footer and on the Contact page (and in
  the privacy policy's data-controller line, which must name where the business is based).
- No location in the homepage or About hero, the site-wide default meta description, or share text.

## Link rules (2026-10-31)
- Pages on aimsmartsolutions.tech and the demo apps (aidemolab.github.io), including the demo bar's
  "Back to AIM Smart Solutions", "All services", "Other demos" and "Book a call": same tab.
- Any other website: new tab via `ExternalLink` (`target="_blank"`, `rel="noopener noreferrer"`,
  a small ↗ and a hidden "(opens in a new tab)"). mailto: and tel: have no target. Same-page
  anchors unchanged. A test in `tests/quality.test.mjs` checks every exported page.

- Footer social links (2026-10-31): LinkedIn (linkedin.com/company/aimsmartsolutionsuk) and Facebook
  (facebook.com/aimsmartsolutions.tech) as small icons side by side under the email address
  (`SOCIAL` in `lib/site.ts`). New tab, rel="noopener noreferrer", hidden label "AIM Smart Solutions on
  LinkedIn/Facebook (opens in a new tab)". Icon-only, so no ↗; the link-rules test allows that for these
  two only and checks both are in the footer of every page.

## Showreel v2 with Jamie voiceover (2026-10-31)
- `showreel-v2` (34.2 s, 16:9 and 1:1) replaces the silent v1 on Video Production and /services/.
  Jamie voiceover (ElevenLabs voice llNlEi50DSCIEuoOIaH7, eleven_multilingual_v2, default
  settings), burned-in captions, finished with `video/finish.py` (-16 LUFS, no music).
- Script: "Customers decide in seconds whether a business looks right for them. A short video can
  show them exactly what you do. At AIM Smart Solutions, we create promo, demo and explainer videos
  for any business, with the script, voiceover and captions included. Every demo video on our
  website was made this way, from AI voice agents and smart apps to live dashboards and training.
  Ready for your website, LinkedIn and social media. Want a video that shows what you do? Book a
  free AI Opportunity Call at aimsmartsolutions.tech."
- Cut to the narration: AIM title card; Property dashboard; Voice Agents explainer; Property what-if;
  then each demo on its word (voice agents call, Pharmaceutical app, Supplier Risk dashboard, Skills
  Taster); Supplier what-if; end card "Book a free AI Opportunity Call / aimsmartsolutions.tech".
- Clips are fresh caption-free recordings (video/*.spec.ts) plus the clean Voice Agents scenes,
  because v1's clips had the old narration's captions burned in.
