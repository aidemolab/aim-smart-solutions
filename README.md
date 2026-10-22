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

No open-source licence has been granted for this project.
Third-party components remain subject to their respective licences.
