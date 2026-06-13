import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "MundialPredictions";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // ¡Importante para que tu web pueda llamarlo!
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
  };

  if (event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, userId, predictions, finals, phaseId, isActive } = body;

    // ACCIÓN 1: GUARDAR PREDICCIONES DE USUARIO
    if (action === "save") {
      await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: "SET predictions = :p, finals = :f",
        ExpressionAttributeValues: { ":p": predictions, ":f": finals }
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ message: "Guardado OK" }) };
    }

    // ACCIÓN 2: TOGGLE DE FASES (PARA EL ADMIN)
    if (action === "togglePhase") {
      const getRes = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId: "SYSTEM_SETTINGS" }
      }));
      
      let activePhases = getRes.Item?.activePhases || [];
      if (isActive && !activePhases.includes(phaseId)) {
        activePhases.push(phaseId);
      } else if (!isActive) {
        activePhases = activePhases.filter(p => p !== phaseId);
      }

      await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { userId: "SYSTEM_SETTINGS", activePhases }
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ activePhases }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Acción no válida" }) };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
