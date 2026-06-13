import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const SOUTH_AMERICAN_TEAMS = ["Argentina", "Brasil", "Uruguay", "Colombia", "Ecuador", "Paraguay", "Chile", "Perú", "Venezuela", "Bolivia"];
const KNOCKOUT_GROUPS = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"];

export const handler = async (event) => {
  const { RAPIDAPI_KEY, BUCKET_NAME, TABLE_NAME } = process.env;

  try {
    // 1. CONSULTAR API-FOOTBALL
    const response = await fetch("https://api-football-v1.p.rapidapi.com/v3/fixtures?league=1&season=2026", {
      method: "GET",
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" }
    });
    const apiData = await response.json();
    
    // 2. MAPEAR RESULTADOS (API -> NUESTRO FORMATO)
    // Para simplificar esta guía, usaremos un mapa manual de IDs de la API a nuestros IDs
    // O puedes buscar por nombres de equipos.
    const realResults = {};
    if (apiData.response) {
       apiData.response.forEach(f => {
          // Lógica de mapeo basada en nombres o IDs
          // Ejemplo: const matchId = getMyId(f.teams.home.name, f.teams.away.name);
          // realResults[matchId] = { homeGoals: f.goals.home, awayGoals: f.goals.away, status: f.fixture.status.short === 'FT' ? 'finished' : 'live' };
       });
    }

    // SIMULACIÓN para la prueba inicial (reemplazar con el loop de arriba cuando tengas los IDs de la API)
    const simulatedResults = {
       "mex_saf": { homeGoals: 2, awayGoals: 0, status: 'finished', group: 'A' },
       "sko_rch": { homeGoals: 2, awayGoals: 1, status: 'finished', group: 'A' }
    };

    // 3. ACTUALIZAR PUNTOS DE TODOS LOS USUARIOS EN DYNAMODB
    const participantsRes = await db.send(new ScanCommand({ TableName: TABLE_NAME }));
    const participants = participantsRes.Items.filter(i => i.userId !== "SYSTEM_SETTINGS");

    for (const user of participants) {
      let totalPoints = 0;
      Object.keys(simulatedResults).forEach(mId => {
        const pred = user.predictions[mId];
        const res = simulatedResults[mId];
        if (pred && pred.goles_local !== null) {
          totalPoints += calculatePoints(pred, res);
        }
      });

      await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId: user.userId },
        UpdateExpression: "SET totalPoints = :p",
        ExpressionAttributeValues: { ":p": totalPoints }
      }));
      
      // Actualizamos el objeto en memoria para el snapshot
      user.totalPoints = totalPoints;
    }

    // 4. GENERAR SNAPSHOT EN S3
    const settingsRes = await db.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId: "SYSTEM_SETTINGS" } }));
    const snapshot = {
      participants,
      settings: settingsRes.Item || { activePhases: ["grupos"] },
      realResults: simulatedResults,
      lastUpdated: new Date().toISOString()
    };

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "data_snapshot.json",
      Body: JSON.stringify(snapshot),
      ContentType: "application/json",
      CacheControl: "no-cache"
    }));

    return { statusCode: 200, body: "Sincronización y Puntos actualizados" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

// Función de puntajes espejo de lib/scoring.ts
function calculatePoints(pred, res) {
  const isKnockout = KNOCKOUT_GROUPS.includes(res.group);
  const isColombia = pred.local === "Colombia" || pred.visitante === "Colombia";
  const isSouthAmerica = SOUTH_AMERICAN_TEAMS.includes(pred.local) || SOUTH_AMERICAN_TEAMS.includes(pred.visitante);

  // Exacto
  if (pred.goles_local === res.homeGoals && pred.goles_visitante === res.awayGoals) {
    if (isColombia) return 5;
    if (isSouthAmerica) return 4;
    return 3;
  }

  // Resultado
  if (isKnockout) {
    const pPass = pred.goles_local > pred.goles_visitante ? 'home' : (pred.goles_local < pred.goles_visitante ? 'away' : null);
    const rPass = res.homeGoals > res.awayGoals ? 'home' : (res.homeGoals < res.awayGoals ? 'away' : null);
    if (pPass && pPass === rPass) {
      return (isColombia || isSouthAmerica) ? 3 : 2;
    }
  } else {
    const pW = pred.goles_local > pred.goles_visitante ? 'h' : (pred.goles_local < pred.goles_visitante ? 'a' : 'd');
    const rW = res.homeGoals > res.awayGoals ? 'h' : (res.homeGoals < res.awayGoals ? 'a' : 'd');
    if (pW === rW) return 1;
  }
  return 0;
}
