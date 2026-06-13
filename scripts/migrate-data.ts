import fs from 'fs';
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../lib/aws-config";

const TABLE_NAME = "MundialPredictions";

async function migrate() {
  try {
    const rawData = fs.readFileSync('./public/predicciones.json', 'utf-8');
    const participants = JSON.parse(rawData);

    for (const p of participants) {
      const userId = p.participante.toLowerCase().replace(/\s+/g, '_');
      const randomNum = Math.floor(1000 + Math.random() * 9000); // Genera número de 4 dígitos
      const item = {
        userId: userId,
        name: p.participante,
        password: `${userId}${randomNum}`, 
        predictions: p.predicciones_partidos,
        finals: p.predicciones_finales,
        totalPoints: 0,
        missingDataWarning: false
      };

      await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));
      console.log(`✅ Migrado: ${p.participante} | Password: ${item.password}`);
    }
    console.log("\n🚀 Migración completada exitosamente.");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  }
}

migrate();
