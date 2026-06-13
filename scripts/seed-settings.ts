import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../lib/aws-config";

async function seedSettings() {
  try {
    await db.send(new PutCommand({
      TableName: "MundialPredictions",
      Item: {
        userId: "SYSTEM_SETTINGS",
        activePhases: ["grupos"] // Start with only groups active
      }
    }));
    console.log("✅ Configuración del sistema inicializada en DynamoDB.");
  } catch (error) {
    console.error("❌ Error inicializando configuración:", error);
  }
}

seedSettings();
