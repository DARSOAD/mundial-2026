# Mundial 2026 Phase 1: Infrastructure & Data Migration

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the DynamoDB database and migrate existing family predictions from `public/predicciones.json`.

**Architecture:** We will use a single DynamoDB table to store all participant data. A migration script will read the existing JSON, transform it to the DynamoDB schema, and populate the table.

**Tech Stack:** Node.js, AWS SDK v3, DynamoDB, TypeScript.

---

### Task 1: Initialize Project & Setup Environment

**Files:**
- Create: `package.json`
- Create: `.env.local`
- Create: `lib/aws-config.ts`

**Step 1: Create package.json with dependencies**
Run: `npm init -y`
Run: `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb dotenv zod`
Run: `npm install -D typescript ts-node @types/node`

**Step 2: Setup AWS Config**
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const db = DynamoDBDocumentClient.from(client);
```

**Step 3: Commit**
```bash
git add package.json package-lock.json lib/aws-config.ts
git commit -m "chore: initial project setup and aws config"
```

---

### Task 2: Define DynamoDB Schema & Migration Script

**Files:**
- Create: `scripts/migrate-data.ts`
- Test: `tests/migration.test.ts`

**Step 1: Write Migration Script Logic**
```typescript
import fs from 'fs';
import { db } from '../lib/aws-config';
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "MundialPredictions";

async function migrate() {
  const rawData = fs.readFileSync('./public/predicciones.json', 'utf-8');
  const participants = JSON.parse(rawData);

  for (const p of participants) {
    const item = {
      userId: p.participante.toLowerCase().replace(/\s+/g, '_'),
      name: p.participante,
      password: "123", // Default password for migration
      predictions: p.predicciones_partidos,
      finals: p.predicciones_finales,
      totalPoints: 0,
      missingDataWarning: false
    };

    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    console.log(`Migrated: ${p.participante}`);
  }
}
```

**Step 2: Run migration script**
Run: `npx ts-node scripts/migrate-data.ts`
Expected: Success messages for each participant.

**Step 3: Commit**
```bash
git add scripts/migrate-data.ts
git commit -m "feat: add data migration script for dynamodb"
```

---

### Task 3: Basic Next.js Layout & UI Foundation

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Modify: `tailwind.config.ts`

**Step 1: Setup Dark Mode Theme**
```typescript
// tailwind.config.ts
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        primary: "#22c55e", // Grass green
        accent: "#eab308",  // Trophy gold
      }
    }
  },
  darkMode: "class",
}
```

**Step 2: Create Main Dashboard Shell**
```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-white p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Mundial 2026</h1>
        <div className="bg-accent text-black px-3 py-1 rounded-full font-bold">
          Leaderboard
        </div>
      </header>
      {/* Content will go here */}
    </main>
  );
}
```

**Step 3: Commit**
```bash
git add app/layout.tsx app/page.tsx tailwind.config.ts
git commit -m "feat: basic next.js layout with dark theme"
```
