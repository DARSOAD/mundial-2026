# Mundial 2026 Phase 1: Local Environment & Data Migration

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Setup DynamoDB Local with Docker, configure environment switching, and migrate data to the local instance.

**Architecture:** Use `docker-compose` for DynamoDB Local. The application will use an environment variable `IS_LOCAL=true` to point the AWS SDK to the local endpoint (`http://localhost:8000`).

**Tech Stack:** Docker, Next.js, AWS SDK v3, TypeScript.

---

### Task 0: DynamoDB Local with Docker

**Files:**
- Create: `docker-compose.yml`
- Create: `scripts/create-local-table.ts`

**Step 1: Create docker-compose.yml**
```yaml
version: '3.8'
services:
  dynamodb-local:
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    image: "amazon/dynamodb-local:latest"
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    volumes:
      - "./docker/dynamodb:/home/dynamodblocal/data"
    working_dir: /home/dynamodblocal
```

**Step 2: Start Docker Container**
Run: `docker-compose up -d`

**Step 3: Write script to create the table locally**
```typescript
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { db } from "../lib/aws-config";

async function createTable() {
  const command = new CreateTableCommand({
    TableName: "MundialPredictions",
    AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  });
  await db.send(command);
  console.log("Local table created!");
}
```

**Step 4: Commit**
```bash
git add docker-compose.yml scripts/create-local-table.ts
git commit -m "chore: setup dynamodb local with docker"
```

---

### Task 1: Environment Switching Logic

**Files:**
- Modify: `lib/aws-config.ts`
- Create: `.env.local`

**Step 1: Update AWS Config to handle Local Endpoint**
```typescript
const isLocal = process.env.NEXT_PUBLIC_IS_LOCAL === "true";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: isLocal ? "http://localhost:8000" : undefined,
  credentials: {
    accessKeyId: isLocal ? "local" : process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: isLocal ? "local" : process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

**Step 2: Setup .env.local**
```env
NEXT_PUBLIC_IS_LOCAL=true
AWS_REGION=us-east-1
```

**Step 3: Commit**
```bash
git add lib/aws-config.ts .env.local
git commit -m "feat: add environment switching for local dynamodb"
```

---

### Task 2: Data Migration (Local)

**Files:**
- Create: `scripts/migrate-data.ts`

**Step 1: Implement migration logic** (Same as before, but ensure it uses the updated `db` config).

**Step 2: Run migration**
Run: `npx ts-node scripts/migrate-data.ts`

**Step 3: Commit**
```bash
git add scripts/migrate-data.ts
git commit -m "feat: migrate json data to local dynamodb"
```
