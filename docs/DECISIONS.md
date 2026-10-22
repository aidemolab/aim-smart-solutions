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
