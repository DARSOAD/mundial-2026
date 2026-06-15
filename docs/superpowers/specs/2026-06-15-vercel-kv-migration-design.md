# Mundial 2026 — Migration: Drop DynamoDB + RapidAPI, Keep S3/CloudFront/Lambda

## Goal
Remove DynamoDB and paid football API. Diego updates results manually via admin page. Lambda writes results JSON to S3. Static site on CloudFront reads it.

## Architecture

```
S3 + CloudFront (static export, unchanged hosting)
├── public/predicciones.json     Read-only predictions
├── public/calendario.json       All 72 group matches + knockout dates
├── resultados.json (on S3)      Written by Lambda, read by client
│
Lambda (free tier)
├── POST { action: "saveResults", userId: "diego", results: {...} }
│   → Validates admin → Writes resultados.json to S3
│   → Invalidates CloudFront cache
│
Admin Page /admin/results (client-side, static)
├── Diego enters match scores
├── Calls Lambda to save
└── Protected by diego login (localStorage)
```

## Data Flow

### Reading (any user)
```
Page loads → fetch /mundial-2026/resultados.json from CloudFront
→ Calculate points client-side using scoring.ts (unchanged)
```

### Writing (admin only)
```
Diego visits /admin/results → sees match list → enters scores
→ POST to Lambda with results object
→ Lambda writes resultados.json to S3
→ Lambda invalidates CloudFront cache
→ All users see updated data on next load
```

## Files to Create

### `app/admin/results/page.tsx`
- Client component, protected (diego only)
- Lists all matches from calendario.json grouped by date
- Each match: two number inputs + status toggle (finished/scheduled)
- Save button POSTs to Lambda
- Shows current results loaded from resultados.json

### `aws/lambda-results.js`
- Replaces lambda-sync.js and lambda-save.js
- Single Lambda handling saveResults action
- Writes JSON to S3 bucket
- Invalidates CloudFront distribution

## Files to Modify

### `package.json`
- Remove: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`

### `lib/data.ts`
- Rewrite: fetch resultados.json from CloudFront (like current snapshot approach)
- Remove DynamoDB/API_URL references
- `getResults()`: fetches resultados.json
- `getParticipants()`: reads predicciones.json client-side

### `lib/matches.ts`
- Expand MATCH_ID_MAP to all 72 group matches
- Or use pred_id field from calendario.json directly

### `lib/static-data.ts`
- Update MATCH_ID_MAP to match new calendario.json

### `public/calendario.json`
- Expand to all 72 group matches
- Add pred_id and home_is_pred_local fields
- Update times to match user's schedule

### Consumer pages (minimal changes)
- `app/page.tsx` — fetch resultados.json instead of data_snapshot.json
- `app/leaderboard/page.tsx` — same
- `app/calendar/page.tsx` — same
- `app/matches/page.tsx` — same
- `app/matches/[id]/match-detail-client.tsx` — same

## Files to Delete
- `lib/aws-config.ts`
- `lib/admin-actions.ts` (replaced by direct Lambda call)
- `aws/lambda-sync.js` (replaced by lambda-results.js)
- `aws/lambda-save.js` (replaced by lambda-results.js)
- `scripts/seed-settings.ts`
- `scripts/simulate-real-scores.ts`
- `scripts/test-scoring-engine.ts`
- `public/data_snapshot.json`

## What stays unchanged
- `next.config.ts` — still output: 'export', basePath, trailingSlash
- `lib/scoring.ts` — exact same scoring engine
- `lib/auth.ts` — localStorage auth
- `lib/flags.ts` — flag URLs
- `public/predicciones.json` — read-only
- `components/Navbar.tsx`
- `app/layout.tsx`

## resultados.json format (on S3)
```json
{
  "mex_saf": { "homeGoals": 2, "awayGoals": 0, "status": "finished" },
  "sko_rch": { "homeGoals": 2, "awayGoals": 1, "status": "finished" }
}
```
homeGoals = prediction's local team goals. awayGoals = prediction's visitante team goals.

## calendario.json new entry format
```json
{
  "match_id": 1,
  "pred_id": "mex_saf",
  "date": "2026-06-11",
  "time_colombia": "14:00",
  "group": "A",
  "team_home": "Mexico",
  "team_away": "Sudafrica",
  "home_is_pred_local": true
}
```
When home_is_pred_local=false (jornada 2/3 reversed matches), admin UI swaps scores before saving.

## Lambda environment
- S3_BUCKET: existing bucket name
- CLOUDFRONT_DISTRIBUTION_ID: existing distribution
- No DynamoDB, no RapidAPI keys needed
