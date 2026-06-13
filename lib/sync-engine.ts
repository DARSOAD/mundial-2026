import { getParticipants } from "./data";
import { calculateMatchPoints } from "./scoring";
import { db } from "./aws-config";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export interface ApiMatch {
  id: string; // El ID que usamos en el JSON, ej: "mex_saf"
  homeGoals: number;
  awayGoals: number;
  status: 'live' | 'finished' | 'scheduled';
}

export async function syncUserPoints(realResults: ApiMatch[]) {
  const participants = await getParticipants();
  const syncResults = [];

  for (const user of participants) {
    let newTotalPoints = 0;
    
    // Calculamos puntos para cada partido basado en los resultados reales
    for (const match of realResults) {
      const prediction = user.predictions[match.id];
      if (prediction) {
        newTotalPoints += calculateMatchPoints(prediction, {
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          status: match.status
        });
      }
    }

    // Actualizamos en DynamoDB
    await db.send(new UpdateCommand({
      TableName: "MundialPredictions",
      Key: { userId: user.userId },
      UpdateExpression: "SET totalPoints = :p",
      ExpressionAttributeValues: { ":p": newTotalPoints }
    }));

    syncResults.push({ name: user.name, points: newTotalPoints });
  }

  return syncResults;
}
