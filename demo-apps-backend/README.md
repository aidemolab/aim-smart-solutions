# Demo apps backend

Backend for the three AIM data demos (supplier risk, sales lead scoring, property investment).
Target project: **AIM Pharmaceutical AI Demo** (`xlxyphqzdzhipmllhxaq`). Never the AIM Smart
Solutions customer project (`pabdxvsukpznvfgathre`).

| File | What it is |
|---|---|
| `schema.sql` | Tables, constraints, RLS, per-IP limit function, hourly 24-hour cleanup (pg_cron) |
| `seed.sql` | The sample rows (generated from each app's original data) |
| `supabase/functions/demo-data/index.ts` | The only write path: origin lock, validation, rate limits |

Apply (from this folder, linked to the demo project):

```bash
npx supabase db query --linked -f schema.sql
npx supabase db query --linked -f seed.sql
npx supabase functions deploy demo-data --project-ref xlxyphqzdzhipmllhxaq --no-verify-jwt --use-api
```

The Edge Function runs without JWT verification on purpose (like `pharma-openrouter-chat`): it is
protected by the origin lock, strict validation and the daily limits instead. Tunables:
`DEMO_IP_DAILY_LIMIT` (default 120) and `DEMO_GLOBAL_DAILY_LIMIT` (default 3000).
