# AWS Simplification: Drop DynamoDB + RapidAPI, Keep S3/CloudFront/Lambda

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove DynamoDB and paid football API. Admin updates results via web page. Lambda writes results to S3. Static site reads from CloudFront.

**Architecture:** Static export on S3/CloudFront (unchanged). New Lambda writes `resultados.json` to S3 when admin saves scores. All pages fetch `resultados.json` + `predicciones.json` client-side and calculate points using existing scoring engine.

**Tech Stack:** Next.js 16 (static export), AWS Lambda, S3, CloudFront, TypeScript

---

### Task 1: Update calendario.json with all 72 group matches

**Files:**
- Modify: `public/calendario.json`

Each entry has `pred_id` (maps to prediction key) and `home_is_pred_local` (whether calendar's team_home matches prediction's local team — needed for jornada 2/3 where FIFA swaps home/away).

- [ ] **Step 1: Replace calendario.json with full 72-match schedule**

```json
[
  {"match_id":1,"pred_id":"mex_saf","date":"2026-06-11","time_colombia":"14:00","group":"A","team_home":"Mexico","team_away":"Sudafrica","home_is_pred_local":true},
  {"match_id":2,"pred_id":"sko_rch","date":"2026-06-11","time_colombia":"21:00","group":"A","team_home":"Corea del Sur","team_away":"Republica Checa","home_is_pred_local":true},
  {"match_id":3,"pred_id":"can_bih","date":"2026-06-12","time_colombia":"14:00","group":"B","team_home":"Canada","team_away":"Bosnia y Herzegovina","home_is_pred_local":true},
  {"match_id":4,"pred_id":"usa_par","date":"2026-06-12","time_colombia":"20:00","group":"D","team_home":"USA","team_away":"Paraguay","home_is_pred_local":true},
  {"match_id":5,"pred_id":"qat_sui","date":"2026-06-13","time_colombia":"14:00","group":"B","team_home":"Qatar","team_away":"Suiza","home_is_pred_local":true},
  {"match_id":6,"pred_id":"bra_mar","date":"2026-06-13","time_colombia":"17:00","group":"C","team_home":"Brasil","team_away":"Marruecos","home_is_pred_local":true},
  {"match_id":7,"pred_id":"hai_esc","date":"2026-06-13","time_colombia":"20:00","group":"C","team_home":"Haiti","team_away":"Escocia","home_is_pred_local":true},
  {"match_id":8,"pred_id":"aus1_tur","date":"2026-06-13","time_colombia":"23:00","group":"D","team_home":"Australia","team_away":"Turquia","home_is_pred_local":true},
  {"match_id":9,"pred_id":"ale_cur","date":"2026-06-14","time_colombia":"12:00","group":"E","team_home":"Alemania","team_away":"Curazao","home_is_pred_local":true},
  {"match_id":10,"pred_id":"hol_jap","date":"2026-06-14","time_colombia":"15:00","group":"F","team_home":"Holanda","team_away":"Japon","home_is_pred_local":true},
  {"match_id":11,"pred_id":"cdm_ecu","date":"2026-06-14","time_colombia":"18:00","group":"E","team_home":"Costa de Marfil","team_away":"Ecuador","home_is_pred_local":true},
  {"match_id":12,"pred_id":"sue_tun","date":"2026-06-14","time_colombia":"21:00","group":"F","team_home":"Suecia","team_away":"Tunez","home_is_pred_local":true},
  {"match_id":13,"pred_id":"esp_cve","date":"2026-06-15","time_colombia":"11:00","group":"G","team_home":"Espana","team_away":"Cabo Verde","home_is_pred_local":true},
  {"match_id":14,"pred_id":"bel_egi","date":"2026-06-15","time_colombia":"14:00","group":"H","team_home":"Belgica","team_away":"Egipto","home_is_pred_local":true},
  {"match_id":15,"pred_id":"asa_uru","date":"2026-06-15","time_colombia":"17:00","group":"G","team_home":"Arabia Saudita","team_away":"Uruguay","home_is_pred_local":true},
  {"match_id":16,"pred_id":"ira_nze","date":"2026-06-15","time_colombia":"20:00","group":"H","team_home":"Iran","team_away":"Nueva Zelanda","home_is_pred_local":true},
  {"match_id":17,"pred_id":"fra_sen","date":"2026-06-16","time_colombia":"14:00","group":"I","team_home":"Francia","team_away":"Senegal","home_is_pred_local":true},
  {"match_id":18,"pred_id":"irq_nor","date":"2026-06-16","time_colombia":"17:00","group":"I","team_home":"Iraq","team_away":"Noruega","home_is_pred_local":true},
  {"match_id":19,"pred_id":"arg_alg","date":"2026-06-16","time_colombia":"20:00","group":"J","team_home":"Argentina","team_away":"Argelia","home_is_pred_local":true},
  {"match_id":20,"pred_id":"aut_jor","date":"2026-06-16","time_colombia":"23:00","group":"J","team_home":"Austria","team_away":"Jordania","home_is_pred_local":true},
  {"match_id":21,"pred_id":"por_con","date":"2026-06-17","time_colombia":"12:00","group":"K","team_home":"Portugal","team_away":"Congo","home_is_pred_local":true},
  {"match_id":22,"pred_id":"ing_cro","date":"2026-06-17","time_colombia":"15:00","group":"L","team_home":"Inglaterra","team_away":"Croacia","home_is_pred_local":true},
  {"match_id":23,"pred_id":"gha_pan","date":"2026-06-17","time_colombia":"18:00","group":"L","team_home":"Ghana","team_away":"Panama","home_is_pred_local":true},
  {"match_id":24,"pred_id":"uzb_col","date":"2026-06-17","time_colombia":"21:00","group":"K","team_home":"Uzbekistan","team_away":"Colombia","home_is_pred_local":true},

  {"match_id":25,"pred_id":"saf_rch","date":"2026-06-18","time_colombia":"11:00","group":"A","team_home":"Republica Checa","team_away":"Sudafrica","home_is_pred_local":false},
  {"match_id":26,"pred_id":"bih_sui","date":"2026-06-18","time_colombia":"14:00","group":"B","team_home":"Suiza","team_away":"Bosnia y Herzegovina","home_is_pred_local":false},
  {"match_id":27,"pred_id":"can_qat","date":"2026-06-18","time_colombia":"17:00","group":"B","team_home":"Canada","team_away":"Qatar","home_is_pred_local":true},
  {"match_id":28,"pred_id":"mex_sko","date":"2026-06-18","time_colombia":"20:00","group":"A","team_home":"Mexico","team_away":"Corea del Sur","home_is_pred_local":true},
  {"match_id":29,"pred_id":"usa_aus1","date":"2026-06-19","time_colombia":"14:00","group":"D","team_home":"USA","team_away":"Australia","home_is_pred_local":true},
  {"match_id":30,"pred_id":"mar_esc","date":"2026-06-19","time_colombia":"17:00","group":"C","team_home":"Escocia","team_away":"Marruecos","home_is_pred_local":false},
  {"match_id":31,"pred_id":"bra_hai","date":"2026-06-19","time_colombia":"20:00","group":"C","team_home":"Brasil","team_away":"Haiti","home_is_pred_local":true},
  {"match_id":32,"pred_id":"par_tur","date":"2026-06-19","time_colombia":"23:00","group":"D","team_home":"Turquia","team_away":"Paraguay","home_is_pred_local":false},
  {"match_id":33,"pred_id":"hol_sue","date":"2026-06-20","time_colombia":"14:00","group":"F","team_home":"Holanda","team_away":"Suecia","home_is_pred_local":true},
  {"match_id":34,"pred_id":"ale_cdm","date":"2026-06-20","time_colombia":"15:00","group":"E","team_home":"Alemania","team_away":"Costa de Marfil","home_is_pred_local":true},
  {"match_id":35,"pred_id":"cur_ecu","date":"2026-06-20","time_colombia":"19:00","group":"E","team_home":"Ecuador","team_away":"Curazao","home_is_pred_local":false},
  {"match_id":36,"pred_id":"jap_tun","date":"2026-06-20","time_colombia":"23:00","group":"F","team_home":"Tunez","team_away":"Japon","home_is_pred_local":false},
  {"match_id":37,"pred_id":"esp_asa","date":"2026-06-21","time_colombia":"11:00","group":"G","team_home":"Espana","team_away":"Arabia Saudita","home_is_pred_local":true},
  {"match_id":38,"pred_id":"bel_ira","date":"2026-06-21","time_colombia":"14:00","group":"H","team_home":"Belgica","team_away":"Iran","home_is_pred_local":true},
  {"match_id":39,"pred_id":"cve_uru","date":"2026-06-21","time_colombia":"17:00","group":"G","team_home":"Uruguay","team_away":"Cabo Verde","home_is_pred_local":false},
  {"match_id":40,"pred_id":"egi_nze","date":"2026-06-21","time_colombia":"20:00","group":"H","team_home":"Nueva Zelanda","team_away":"Egipto","home_is_pred_local":false},
  {"match_id":41,"pred_id":"arg_aut","date":"2026-06-22","time_colombia":"12:00","group":"J","team_home":"Argentina","team_away":"Austria","home_is_pred_local":true},
  {"match_id":42,"pred_id":"fra_irq","date":"2026-06-22","time_colombia":"16:00","group":"I","team_home":"Francia","team_away":"Iraq","home_is_pred_local":true},
  {"match_id":43,"pred_id":"sen_nor","date":"2026-06-22","time_colombia":"19:00","group":"I","team_home":"Noruega","team_away":"Senegal","home_is_pred_local":false},
  {"match_id":44,"pred_id":"alg_jor","date":"2026-06-22","time_colombia":"22:00","group":"J","team_home":"Jordania","team_away":"Argelia","home_is_pred_local":false},
  {"match_id":45,"pred_id":"por_uzb","date":"2026-06-23","time_colombia":"12:00","group":"K","team_home":"Portugal","team_away":"Uzbekistan","home_is_pred_local":true},
  {"match_id":46,"pred_id":"ing_gha","date":"2026-06-23","time_colombia":"15:00","group":"L","team_home":"Inglaterra","team_away":"Ghana","home_is_pred_local":true},
  {"match_id":47,"pred_id":"cro_pan","date":"2026-06-23","time_colombia":"18:00","group":"L","team_home":"Panama","team_away":"Croacia","home_is_pred_local":false},
  {"match_id":48,"pred_id":"con_col","date":"2026-06-23","time_colombia":"21:00","group":"K","team_home":"Colombia","team_away":"Congo","home_is_pred_local":false},

  {"match_id":49,"pred_id":"can_sui","date":"2026-06-24","time_colombia":"14:00","group":"B","team_home":"Suiza","team_away":"Canada","home_is_pred_local":false},
  {"match_id":50,"pred_id":"bih_qat","date":"2026-06-24","time_colombia":"14:00","group":"B","team_home":"Bosnia y Herzegovina","team_away":"Qatar","home_is_pred_local":true},
  {"match_id":51,"pred_id":"bra_esc","date":"2026-06-24","time_colombia":"17:00","group":"C","team_home":"Escocia","team_away":"Brasil","home_is_pred_local":false},
  {"match_id":52,"pred_id":"mar_hai","date":"2026-06-24","time_colombia":"17:00","group":"C","team_home":"Marruecos","team_away":"Haiti","home_is_pred_local":true},
  {"match_id":53,"pred_id":"mex_rch","date":"2026-06-24","time_colombia":"20:00","group":"A","team_home":"Republica Checa","team_away":"Mexico","home_is_pred_local":false},
  {"match_id":54,"pred_id":"saf_sko","date":"2026-06-24","time_colombia":"20:00","group":"A","team_home":"Sudafrica","team_away":"Corea del Sur","home_is_pred_local":true},
  {"match_id":55,"pred_id":"cur_cdm","date":"2026-06-25","time_colombia":"15:00","group":"E","team_home":"Curazao","team_away":"Costa de Marfil","home_is_pred_local":true},
  {"match_id":56,"pred_id":"ale_ecu","date":"2026-06-25","time_colombia":"15:00","group":"E","team_home":"Ecuador","team_away":"Alemania","home_is_pred_local":false},
  {"match_id":57,"pred_id":"jap_sue","date":"2026-06-25","time_colombia":"18:00","group":"F","team_home":"Japon","team_away":"Suecia","home_is_pred_local":true},
  {"match_id":58,"pred_id":"hol_tun","date":"2026-06-25","time_colombia":"18:00","group":"F","team_home":"Tunez","team_away":"Holanda","home_is_pred_local":false},
  {"match_id":59,"pred_id":"usa_tur","date":"2026-06-25","time_colombia":"21:00","group":"D","team_home":"Turquia","team_away":"USA","home_is_pred_local":false},
  {"match_id":60,"pred_id":"par_aus1","date":"2026-06-25","time_colombia":"21:00","group":"D","team_home":"Paraguay","team_away":"Australia","home_is_pred_local":true},
  {"match_id":61,"pred_id":"fra_nor","date":"2026-06-26","time_colombia":"14:00","group":"I","team_home":"Noruega","team_away":"Francia","home_is_pred_local":false},
  {"match_id":62,"pred_id":"sen_irq","date":"2026-06-26","time_colombia":"14:00","group":"I","team_home":"Senegal","team_away":"Iraq","home_is_pred_local":true},
  {"match_id":63,"pred_id":"cve_asa","date":"2026-06-26","time_colombia":"19:00","group":"G","team_home":"Cabo Verde","team_away":"Arabia Saudita","home_is_pred_local":true},
  {"match_id":64,"pred_id":"esp_uru","date":"2026-06-26","time_colombia":"19:00","group":"G","team_home":"Uruguay","team_away":"Espana","home_is_pred_local":false},
  {"match_id":65,"pred_id":"egi_ira","date":"2026-06-26","time_colombia":"22:00","group":"H","team_home":"Egipto","team_away":"Iran","home_is_pred_local":true},
  {"match_id":66,"pred_id":"bel_nze","date":"2026-06-26","time_colombia":"22:00","group":"H","team_home":"Nueva Zelanda","team_away":"Belgica","home_is_pred_local":false},
  {"match_id":67,"pred_id":"ing_pan","date":"2026-06-27","time_colombia":"16:00","group":"L","team_home":"Panama","team_away":"Inglaterra","home_is_pred_local":false},
  {"match_id":68,"pred_id":"cro_gha","date":"2026-06-27","time_colombia":"16:00","group":"L","team_home":"Croacia","team_away":"Ghana","home_is_pred_local":true},
  {"match_id":69,"pred_id":"por_col","date":"2026-06-27","time_colombia":"18:30","group":"K","team_home":"Colombia","team_away":"Portugal","home_is_pred_local":false},
  {"match_id":70,"pred_id":"con_uzb","date":"2026-06-27","time_colombia":"18:30","group":"K","team_home":"Congo","team_away":"Uzbekistan","home_is_pred_local":true},
  {"match_id":71,"pred_id":"alg_aut","date":"2026-06-27","time_colombia":"21:00","group":"J","team_home":"Argelia","team_away":"Austria","home_is_pred_local":true},
  {"match_id":72,"pred_id":"arg_jor","date":"2026-06-27","time_colombia":"21:00","group":"J","team_home":"Jordania","team_away":"Argentina","home_is_pred_local":false}
]
```

- [ ] **Step 2: Commit**

```bash
git add public/calendario.json
git commit -m "feat: expand calendario.json to all 72 group matches with pred_id mapping"
```

---

### Task 2: Remove AWS SDK dependencies from package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall AWS DynamoDB packages**

```bash
npm uninstall @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove DynamoDB SDK dependencies"
```

---

### Task 3: Create new Lambda for saving results to S3

**Files:**
- Create: `aws/lambda-results.js`
- Delete: `aws/lambda-sync.js`
- Delete: `aws/lambda-save.js`

- [ ] **Step 1: Create lambda-results.js**

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const s3 = new S3Client({});
const cf = new CloudFrontClient({});

export const handler = async (event) => {
  const { BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID } = process.env;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, userId, results } = body;

    if (action !== "saveResults") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }

    // Only diego can save results
    if (userId !== "diego") {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
    }

    if (!results || typeof results !== "object") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing results" }) };
    }

    // Read existing results to merge (don't overwrite everything on each save)
    let existing = {};
    try {
      const getRes = await s3.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: "mundial-2026/resultados.json"
      }));
      const text = await getRes.Body.transformToString();
      existing = JSON.parse(text);
    } catch (e) {
      // File doesn't exist yet, start fresh
    }

    // Merge new results into existing
    const merged = { ...existing, ...results };

    // Write to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "mundial-2026/resultados.json",
      Body: JSON.stringify(merged),
      ContentType: "application/json",
      CacheControl: "no-cache, no-store, must-revalidate"
    }));

    // Invalidate CloudFront cache
    if (CLOUDFRONT_DISTRIBUTION_ID) {
      await cf.send(new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: { Quantity: 1, Items: ["/mundial-2026/resultados.json"] }
        }
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results: merged })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

This Lambda needs these IAM permissions:
- `s3:GetObject` and `s3:PutObject` on the bucket
- `cloudfront:CreateInvalidation` on the distribution
Environment variables: `BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`

- [ ] **Step 2: Delete old lambda files**

Delete `aws/lambda-sync.js` and `aws/lambda-save.js`.

- [ ] **Step 3: Commit**

```bash
git add aws/lambda-results.js
git rm aws/lambda-sync.js aws/lambda-save.js
git commit -m "feat: replace DynamoDB lambdas with simple S3 results writer"
```

---

### Task 4: Rewrite lib/data.ts — fetch from JSON files only

**Files:**
- Modify: `lib/data.ts`
- Delete: `lib/aws-config.ts`
- Delete: `lib/admin-actions.ts`

- [ ] **Step 1: Rewrite lib/data.ts**

```typescript
// lib/data.ts
const BASE = '/mundial-2026';

export async function getResults(): Promise<Record<string, any>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/resultados.json`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function getParticipants(): Promise<any[]> {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const res = await fetch(`${BASE}/predicciones.json`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getSystemSettings() {
  return { activePhases: ["grupos"] };
}
```

- [ ] **Step 2: Delete old AWS files**

Delete `lib/aws-config.ts` and `lib/admin-actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts
git rm lib/aws-config.ts lib/admin-actions.ts
git commit -m "refactor: lib/data.ts reads from static JSON files, remove AWS config"
```

---

### Task 5: Update lib/matches.ts and lib/static-data.ts to use pred_id

**Files:**
- Modify: `lib/matches.ts`
- Modify: `lib/static-data.ts`

- [ ] **Step 1: Rewrite lib/matches.ts to use pred_id from calendario.json**

```typescript
// lib/matches.ts

export interface MatchInfo {
  id: string;
  local: string;
  visitante: string;
  date: string;
  time: string;
  group: string;
  order: number;
  homeIsPredLocal: boolean;
}

export async function getAllMatches(): Promise<MatchInfo[]> {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'calendario.json');
      const calendarData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return mapCalendarData(calendarData);
    }

    const res = await fetch('/mundial-2026/calendario.json', { cache: 'no-store' });
    const calendarData = await res.json();
    return mapCalendarData(calendarData);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

function mapCalendarData(data: any[]): MatchInfo[] {
  return data.map((m: any) => {
    const homeIsLocal = m.home_is_pred_local !== false;
    return {
      id: m.pred_id,
      local: homeIsLocal ? m.team_home : m.team_away,
      visitante: homeIsLocal ? m.team_away : m.team_home,
      date: m.date,
      time: m.time_colombia,
      group: m.group,
      order: m.match_id,
      homeIsPredLocal: homeIsLocal,
      // Keep calendar display names for the admin page
      calendarHome: m.team_home,
      calendarAway: m.team_away,
    };
  }).sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 2: Rewrite lib/static-data.ts**

```typescript
// lib/static-data.ts
import fs from 'fs';
import path from 'path';

export function getStaticIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.map((p: any) => p.participante.toLowerCase().replace(/\s+/g, '_'));
  } catch {
    return [];
  }
}

export function getStaticMatchIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'calendario.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.map((m: any) => m.pred_id);
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/matches.ts lib/static-data.ts
git commit -m "refactor: matches.ts uses pred_id from calendario.json, remove MATCH_ID_MAP"
```

---

### Task 6: Update all consumer pages to use getResults() instead of getSnapshotData()

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/leaderboard/page.tsx`
- Modify: `app/calendar/page.tsx`
- Modify: `app/matches/page.tsx`
- Modify: `app/matches/[id]/match-detail-client.tsx`
- Modify: `app/login/page.tsx`

The pattern is the same in every file: replace `getSnapshotData()` with `getResults()` + `getParticipants()`.

- [ ] **Step 1: Update app/page.tsx (homepage)**

Replace the data loading section. Change imports:
```typescript
import { getResults, getParticipants } from "@/lib/data";
```
Replace the `load()` function:
```typescript
async function load() {
  const [results, participants, m] = await Promise.all([
    getResults(),
    getParticipants(),
    getAllMatches()
  ]);
  setData({ participants, realResults: results });
  setMatches(m);
  setIsLoading(false);
}
```
Remove import of `getSnapshotData`.

- [ ] **Step 2: Update app/leaderboard/page.tsx**

Same pattern. Change imports:
```typescript
import { getResults, getParticipants } from "@/lib/data";
```
Replace `load()`:
```typescript
async function load() {
  const [results, participants, m] = await Promise.all([
    getResults(),
    getParticipants(),
    getAllMatches()
  ]);
  setData({ participants, realResults: results });
  setMatches(m);
  setIsLoading(false);
}
```

- [ ] **Step 3: Update app/calendar/page.tsx**

Change imports:
```typescript
import { getResults, getParticipants } from "@/lib/data";
```
Replace `load()`:
```typescript
async function load() {
  const [results, participants, m, u] = await Promise.all([
    getResults(),
    getParticipants(),
    getAllMatches(),
    getLoggedInUser()
  ]);
  setData({ participants, realResults: results });
  setMatches(m);
  setUser(u);
  setIsLoading(false);
}
```

- [ ] **Step 4: Update app/matches/page.tsx**

Change imports:
```typescript
import { getResults } from "@/lib/data";
```
Replace `load()`:
```typescript
async function load() {
  const [results, m] = await Promise.all([getResults(), getAllMatches()]);
  setData({ realResults: results });
  setMatches(m);
  setIsLoading(false);
}
```

- [ ] **Step 5: Update app/matches/[id]/match-detail-client.tsx**

Change imports:
```typescript
import { getResults, getParticipants } from "@/lib/data";
```
Replace `load()`:
```typescript
async function load() {
  const [results, participants, m] = await Promise.all([
    getResults(),
    getParticipants(),
    getAllMatches()
  ]);
  setData({ participants, realResults: results });
  setMatches(m);
  setIsLoading(false);
}
```

- [ ] **Step 6: Update app/login/page.tsx**

Change import:
```typescript
import { getParticipants } from "@/lib/data";
```
The `getParticipants()` function already works — it reads predicciones.json. The existing `load()` function already calls `getParticipants()` directly, so this may already work. Verify the import path is correct and `getParticipants` returns the right format.

The participants from predicciones.json have format `{ participante, predicciones_partidos, predicciones_finales }`. The login page needs `userId` and `name`. Check that the mapping works:
```typescript
// In getParticipants, transform to expected format:
const participants = await getParticipants();
const users = participants.map((p: any) => ({
  userId: p.participante.toLowerCase().replace(/\s+/g, '_'),
  name: p.participante
})).sort((a: any, b: any) => a.name.localeCompare(b.name));
```

Note: The current `data_snapshot.json` had participants with `userId`, `name`, `predictions`, `password` fields (from DynamoDB). Now reading from `predicciones.json`, the format is different: `participante`, `predicciones_partidos`, `predicciones_finales`. We need `getParticipants()` to normalize this.

Update `lib/data.ts` `getParticipants()` to normalize:

```typescript
export async function getParticipants(): Promise<any[]> {
  try {
    let raw: any[];
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
      raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      const res = await fetch(`${BASE}/predicciones.json`, { cache: 'no-store' });
      if (!res.ok) return [];
      raw = await res.json();
    }

    return raw.map((p: any) => ({
      userId: p.participante.toLowerCase().replace(/\s+/g, '_'),
      name: p.participante,
      password: p.password || "1234",
      predictions: p.predicciones_partidos || {},
      finals: p.predicciones_finales || {}
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/leaderboard/page.tsx app/calendar/page.tsx app/matches/page.tsx app/matches/[id]/match-detail-client.tsx app/login/page.tsx lib/data.ts
git commit -m "refactor: all pages use getResults() + getParticipants() instead of snapshot"
```

---

### Task 7: Create admin results page

**Files:**
- Create: `app/admin/results/page.tsx`
- Modify: `app/admin/page.tsx` (add link to results page)

- [ ] **Step 1: Create app/admin/results/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getResults } from "@/lib/data";
import { getAllMatches, MatchInfo } from "@/lib/matches";
import { getFlag } from "@/lib/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getLoggedInUser();
      if (!user || user.userId !== "diego") {
        window.location.href = "/mundial-2026/";
        return;
      }
      const [m, r] = await Promise.all([getAllMatches(), getResults()]);
      setMatches(m);
      setResults(r);
      setIsLoading(false);
    }
    load();
  }, []);

  function updateResult(predId: string, field: "homeGoals" | "awayGoals", value: string) {
    const num = value === "" ? null : parseInt(value);
    setResults((prev) => ({
      ...prev,
      [predId]: {
        ...prev[predId],
        [field]: num,
        status: "finished",
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      // Only send matches that have both goals set
      const toSave: Record<string, any> = {};
      Object.entries(results).forEach(([id, r]: [string, any]) => {
        if (r.homeGoals !== null && r.homeGoals !== undefined && r.awayGoals !== null && r.awayGoals !== undefined) {
          toSave[id] = { homeGoals: r.homeGoals, awayGoals: r.awayGoals, status: r.status || "finished" };
        }
      });

      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveResults",
          userId: "diego",
          results: toSave,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Resultados guardados correctamente");
      } else {
        setMessage("Error: " + (data.error || "Unknown"));
      }
    } catch (e: any) {
      setMessage("Error de red: " + e.message);
    }
    setSaving(false);
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">
        Verificando Admin...
      </div>
    );

  // Group matches by date
  const matchesByDate: Record<string, MatchInfo[]> = {};
  matches.forEach((m) => {
    if (!matchesByDate[m.date]) matchesByDate[m.date] = [];
    matchesByDate[m.date].push(m);
  });

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white uppercase font-montserrat">
          Actualizar <span className="text-yellow-500">Resultados</span>
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8 py-3 rounded-2xl text-sm uppercase tracking-wider disabled:opacity-50 transition-all"
        >
          {saving ? "Guardando..." : "Guardar Todo"}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl font-bold text-sm ${message.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {message}
        </div>
      )}

      {Object.entries(matchesByDate).map(([date, dateMatches]) => (
        <div key={date} className="mb-8">
          <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">
            {date}
          </h3>
          <div className="flex flex-col gap-3">
            {dateMatches.map((m) => {
              const r = results[m.id] || {};
              const hasResult = r.homeGoals !== null && r.homeGoals !== undefined && r.awayGoals !== null && r.awayGoals !== undefined;

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasResult ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10"}`}
                >
                  <span className="text-[10px] font-black text-white/30 uppercase w-12">{m.time}</span>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <img src={getFlag(m.calendarHome || m.local)} className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="font-bold text-xs text-white uppercase tracking-tight">{m.calendarHome || m.local}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-12 h-10 bg-black/40 border border-white/20 rounded-xl text-center text-white font-black text-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      value={(() => {
                        if (!r || r.homeGoals === null || r.homeGoals === undefined) return "";
                        return m.homeIsPredLocal !== false ? r.homeGoals : r.awayGoals;
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const field = m.homeIsPredLocal !== false ? "homeGoals" : "awayGoals";
                        updateResult(m.id, field, val);
                      }}
                    />
                    <span className="text-white/20 font-black">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-12 h-10 bg-black/40 border border-white/20 rounded-xl text-center text-white font-black text-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      value={(() => {
                        if (!r || r.awayGoals === null || r.awayGoals === undefined) return "";
                        return m.homeIsPredLocal !== false ? r.awayGoals : r.homeGoals;
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const field = m.homeIsPredLocal !== false ? "awayGoals" : "homeGoals";
                        updateResult(m.id, field, val);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-xs text-white/60 uppercase tracking-tight">{m.calendarAway || m.visitante}</span>
                    <img src={getFlag(m.calendarAway || m.visitante)} className="w-6 h-6 rounded-full border border-white/10" />
                  </div>

                  {hasResult && <span className="text-green-500 text-xs font-black">OK</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add calendarHome/calendarAway to MatchInfo interface**

In `lib/matches.ts`, update the interface:
```typescript
export interface MatchInfo {
  id: string;
  local: string;
  visitante: string;
  date: string;
  time: string;
  group: string;
  order: number;
  homeIsPredLocal: boolean;
  calendarHome: string;
  calendarAway: string;
}
```

- [ ] **Step 3: Add link to results page from admin dashboard**

In `app/admin/page.tsx`, add a Link to `/admin/results` next to the existing sync button:
```tsx
<Link href="/admin/results" className="bg-yellow-500 text-black font-black px-6 py-3 rounded-xl text-xs uppercase">Actualizar Resultados</Link>
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/results/page.tsx app/admin/page.tsx lib/matches.ts
git commit -m "feat: admin results page for updating match scores via Lambda"
```

---

### Task 8: Delete obsolete files and clean up

**Files:**
- Delete: `scripts/seed-settings.ts`
- Delete: `scripts/simulate-real-scores.ts`
- Delete: `scripts/test-scoring-engine.ts`
- Delete: `public/data_snapshot.json` (if exists)
- Delete: `app/admin/phase-toggle.tsx` (phase toggle used DynamoDB)
- Modify: `app/admin/page.tsx` (remove PhaseToggle import and usage)

- [ ] **Step 1: Delete scripts and old files**

```bash
git rm scripts/seed-settings.ts scripts/simulate-real-scores.ts scripts/test-scoring-engine.ts
git rm -f public/data_snapshot.json
git rm app/admin/phase-toggle.tsx
```

- [ ] **Step 2: Clean up admin page — remove PhaseToggle references**

In `app/admin/page.tsx`, remove:
- `import PhaseToggle from "./phase-toggle";`
- The entire phases sidebar `<div>` containing PhaseToggle components
- The `getSystemSettings` import and usage (hardcode activePhases to ["grupos"])
- The `togglePhase` action references

- [ ] **Step 3: Remove .env.local AWS credentials** (if they exist)

Remove `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` from `.env.local`. Keep `NEXT_PUBLIC_API_URL` (still needed for Lambda URL) and `NEXT_PUBLIC_IS_LOCAL`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete DynamoDB scripts, phase-toggle, snapshot file, clean up admin"
```

---

### Task 9: Seed initial results and verify

- [ ] **Step 1: Create initial resultados.json for local dev**

Create `public/resultados.json` with the 12 known results for local development:

```json
{
  "mex_saf": { "homeGoals": 2, "awayGoals": 0, "status": "finished" },
  "sko_rch": { "homeGoals": 2, "awayGoals": 1, "status": "finished" },
  "can_bih": { "homeGoals": 1, "awayGoals": 1, "status": "finished" },
  "qat_sui": { "homeGoals": 1, "awayGoals": 1, "status": "finished" },
  "usa_par": { "homeGoals": 4, "awayGoals": 1, "status": "finished" },
  "bra_mar": { "homeGoals": 1, "awayGoals": 1, "status": "finished" },
  "hai_esc": { "homeGoals": 0, "awayGoals": 1, "status": "finished" },
  "aus1_tur": { "homeGoals": 2, "awayGoals": 0, "status": "finished" },
  "ale_cur": { "homeGoals": 7, "awayGoals": 1, "status": "finished" },
  "hol_jap": { "homeGoals": 2, "awayGoals": 2, "status": "finished" },
  "cdm_ecu": { "homeGoals": 1, "awayGoals": 0, "status": "finished" },
  "sue_tun": { "homeGoals": 5, "awayGoals": 1, "status": "finished" }
}
```

- [ ] **Step 2: Run local dev server and verify**

```bash
npm run dev
```

Verify:
1. Homepage loads, shows ranking with correct points
2. Leaderboard page shows same ranking
3. Calendar page shows all 72 matches with predictions matrix
4. Click a match → match detail page shows all predictions
5. `/admin/results` page loads (as diego), shows all matches with score inputs
6. Existing results pre-filled in admin page

- [ ] **Step 3: Verify build works**

```bash
npm run build
```

Expected: Build succeeds. All 72 match detail pages generated as static.

- [ ] **Step 4: Commit**

```bash
git add public/resultados.json
git commit -m "feat: seed initial resultados.json with 12 known results"
```

---

### Task 10: Deploy Lambda and upload results to S3

This task is done manually by the admin (diego) in AWS Console:

- [ ] **Step 1: Create new Lambda function**

In AWS Console:
1. Create Lambda function `mundial-results`
2. Runtime: Node.js 20.x
3. Paste code from `aws/lambda-results.js`
4. Add environment variables: `BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`
5. Attach IAM policy with S3 read/write + CloudFront invalidation permissions
6. Create Function URL (or API Gateway endpoint)
7. Enable CORS on Function URL

- [ ] **Step 2: Update NEXT_PUBLIC_API_URL**

Update `.env.local` and Vercel/build config with the new Lambda URL.

- [ ] **Step 3: Upload initial resultados.json to S3**

```bash
aws s3 cp public/resultados.json s3://YOUR_BUCKET/mundial-2026/resultados.json --content-type "application/json" --cache-control "no-cache"
```

- [ ] **Step 4: Build and deploy static site**

```bash
npm run build
aws s3 sync out/ s3://YOUR_BUCKET/ --delete
```

- [ ] **Step 5: Invalidate CloudFront cache**

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```
