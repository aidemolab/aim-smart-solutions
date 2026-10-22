# AIM Smart Solutions

Website project for AIM Smart Solutions, founded by Dr Alaaeldin Mostafa and based in Bolton, UK.

We help small and medium-sized businesses grow, understand their data and work smarter through practical AI, automation and data solutions.

## Services

- Practical AI solutions and AI agents
- Business workflow automation
- Sales and marketing support
- Data analysis, dashboards and reporting
- AI and data training and consultancy

## Website demonstrations

The website includes demonstrations of:

- Business enquiry handling
- An AI voice agent
- Automated quotations with customer and business emails
- Calendar booking

These demonstrations illustrate potential client solutions. They do not represent verified client outcomes or guaranteed results.

## About this repository

This repository is intended to hold the website source code, assets and project documentation.

The site is a static Next.js export, built for GitHub Pages. There is no server: the
enquiry, quotation and booking forms call Supabase Edge Functions (in `supabase/functions/`)
directly from the browser.

```bash
cp .env.example .env.local   # add the Supabase URL and anon (public) key
npm install
npm run dev                  # http://localhost:3000
npm test                     # builds to out/ and checks every route exported
npm start                    # serves out/ locally
```

Never put the Supabase service-role key, SMTP password or voice-agent token in `.env.local`
or GitHub variables for the site build: anything prefixed `NEXT_PUBLIC_` is visible to visitors.
Those secrets belong only in the Supabase function settings.

## Contact

- Website: https://aimsmartsolutions.tech
- Email: enquiry@aimsmartsolutions.tech

## Licence

All rights reserved. No open-source licence has been granted for this project; see [LICENSE](LICENSE).
Third-party components remain subject to their respective licences.

## Supabase functions

`supabase/functions/` holds the Edge Functions. `save-business-enquiry` and
`vapi-outbound-call` are copies of the deployed versions (v12 and v5), kept for
reference: the live site still uses them, so do not change or redeploy them.

`submit-enquiry` is the new enquiry endpoint for this site. It is **not deployed yet**.
Before deploying it:

1. Apply `supabase/migrations/20261022120000_submit_enquiry_protection.sql`
   (rate-limit table, `form_consume` RPC, `enquiries.call_consent_at`).
2. Create a Cloudflare Turnstile widget for aimsmartsolutions.tech,
   www.aimsmartsolutions.tech and aidemolab.github.io. Add the secret to Supabase as
   `TURNSTILE_SECRET_KEY` and the site key to GitHub as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Optionally set `RATE_LIMIT_SALT` (any random string) in Supabase secrets.
4. Deploy `submit-enquiry` with JWT verification on (the default), and redeploy
   `appointment-booking` and `save-service-request` to pick up the CORS change.

## Deployment

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to
`main`. While `PAGES_PREVIEW` is unset or `true`, the site is built for
https://aidemolab.github.io/aim-smart-solutions/. Switching to the custom domain
(and setting `PAGES_PREVIEW` to `false`) is a separate, later step. DNS changes must
never touch the MX, SPF, DKIM, DMARC or autodiscover records.
