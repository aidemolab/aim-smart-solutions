# CLAUDE.md: standing rules for the AIM Smart Solutions website

Read this and `docs/DECISIONS.md` before changing anything. British English throughout.

## How to work
- Follow `docs/DECISIONS.md`. Record any new lasting decision there.
- Branch → pull request → merge once build, lint and tests pass (`npm run lint`, `npm test`).
  `main` is protected: a PR is required, 0 approvals, so merge your own PRs once checks pass.
- `.env.local` holds Cloudflare's test Turnstile key, but production has none. Run local tests
  like production with an empty key: `NEXT_PUBLIC_TURNSTILE_SITE_KEY= npm test`.
- The site is a static Next.js export on GitHub Pages (aimsmartsolutions.tech). No server code,
  no API routes, no server actions.

## Never
- Never touch DNS or email settings.
- Never put secrets in GitHub or in browser code. Only `NEXT_PUBLIC_` values that are public by
  design (Supabase URL, anon key, Turnstile site key) may reach the build.

## Content rules
- No testimonials, client logos, savings figures or performance claims.
- Every demo carries a badge: "Live" or "Illustrative data" (use `DemoBadge`).
- One main call to action site-wide: "Book a Free AI Opportunity Call" → `/book-appointment/`
  (use the `BOOKING_CTA` constants in `lib/site.ts`).
- Do not invent facts about the business, the founder or results.
- The AI call-back stays off until Turnstile keys are added. Do not describe it as working.

## Quality
- Accessible and mobile-first: test at 375px, keyboard reachable, visible focus, alt text,
  sufficient contrast.
- Check every layout change, and take review screenshots, at 390, 1024, 1280, 1366 and 1440px wide.
  No text squashed into narrow columns, no unequal cards in a row, no content in a narrow strip
  with large empty margins.
- Every page has a unique title and meta description.

## Facts
- Business: AIM Smart Solutions, founder Alaa Mostafa (PhD, physics), Bolton, Greater Manchester.
- Audience: UK SMEs, especially service businesses.
- Email: enquiry@aimsmartsolutions.tech
- Supabase project: pabdxvsukpznvfgathre
- Brand colours: Navy #0B1F33, Cobalt #2563EB, Amber #F59E0B, Slate #1E293B, Light #F8FAFC, White #FFFFFF.
