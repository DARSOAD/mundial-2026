import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { db } from "../lib/aws-config";

async function createTable() {
  const command = new CreateTableCommand({
    TableName: "MundialPredictions",
    AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  });
  
  try {
    await db.send(command);
    console.log("✅ Tabla 'MundialPredictions' creada exitosamente en local.");
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log("ℹ️ La tabla ya existe.");
    } else {
      console.error("❌ Error creando la tabla:", error);
    }
  }
}

createTable();
