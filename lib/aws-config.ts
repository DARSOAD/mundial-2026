import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";

// Cargar .env.local si existe (útil para scripts de Node)
dotenv.config({ path: ".env.local" });

const isLocal = process.env.NEXT_PUBLIC_IS_LOCAL === "true";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: isLocal ? "http://localhost:8001" : undefined,
  credentials: {
    accessKeyId: isLocal ? "local" : process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: isLocal ? "local" : process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const db = DynamoDBDocumentClient.from(client);
