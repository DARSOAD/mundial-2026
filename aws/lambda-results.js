import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const s3 = new S3Client({});
const cf = new CloudFrontClient({});

const PREFIX = "mundial-2026";

async function readJSON(bucket, key) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return JSON.parse(await res.Body.transformToString());
  } catch {
    return null;
  }
}

async function writeJSON(bucket, key, data) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
    CacheControl: "no-cache, no-store, must-revalidate"
  }));
}

async function invalidate(distId, paths) {
  if (!distId) return;
  await cf.send(new CreateInvalidationCommand({
    DistributionId: distId,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: { Quantity: paths.length, Items: paths }
    }
  }));
}

export const handler = async (event) => {
  const { BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID } = process.env;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, userId } = body;

    // ===================== saveResults (admin only) =====================
    if (action === "saveResults") {
      if (userId !== "diego") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      const { results } = body;
      if (!results || typeof results !== "object") {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing results" }) };
      }

      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/resultados.json`)) || {};
      const merged = { ...existing };
      // Merge: null values delete the key, objects update it
      Object.entries(results).forEach(([key, val]) => {
        if (val === null) {
          delete merged[key];
        } else {
          merged[key] = val;
        }
      });
      await writeJSON(BUCKET_NAME, `${PREFIX}/resultados.json`, merged);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/resultados.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, results: merged }) };
    }

    // ===================== saveKnockoutMatches (admin only) =====================
    // Admin creates/updates knockout match entries
    // body.matches = [{ id: "16v_1", phase: "16VOS", local: "Mexico", visitante: "Canada", date: "2026-06-28", time: "11:00" }, ...]
    if (action === "saveKnockoutMatches") {
      if (userId !== "diego") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      const { matches } = body;
      if (!Array.isArray(matches)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing matches array" }) };
      }

      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/eliminatorias.json`)) || [];
      // Merge: update existing by id, add new ones
      const map = {};
      existing.forEach(m => { map[m.id] = m; });
      matches.forEach(m => { map[m.id] = { ...map[m.id], ...m }; });
      const merged = Object.values(map);

      await writeJSON(BUCKET_NAME, `${PREFIX}/eliminatorias.json`, merged);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/eliminatorias.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, matches: merged }) };
    }

    // ===================== saveKnockoutPrediction (any logged-in user) =====================
    // body.matchId = "16v_1", body.prediction = { goles_local: 2, goles_visitante: 1, team_passes: "home" }
    if (action === "saveKnockoutPrediction") {
      if (!userId) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      const { matchId, prediction } = body;
      if (!matchId || !prediction) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing matchId or prediction" }) };
      }

      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`)) || {};
      if (!existing[userId]) existing[userId] = {};
      existing[userId][matchId] = prediction;

      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`, existing);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones-eliminatorias.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ===================== saveSettings (admin only) =====================
    // body.settings = { activePhases: ["grupos", "16vos"] }
    if (action === "saveSettings") {
      if (userId !== "diego") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      const { settings } = body;
      if (!settings) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing settings" }) };
      }

      await writeJSON(BUCKET_NAME, `${PREFIX}/settings.json`, settings);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/settings.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, settings }) };
    }

    // ===================== registerUser (Public) =====================
    if (action === "registerUser") {
      const { username, password, basePredictions, baseFinals } = body;
      if (!username || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing username or password" }) };
      }

      const cleanUserId = username.toLowerCase().trim().replace(/\s+/g, '_');
      
      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`)) || [];
      if (existing.some(u => u.participante.toLowerCase().replace(/\s+/g, '_') === cleanUserId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "El usuario ya existe" }) };
      }

      const newUser = {
        participante: username,
        password: password,
        predicciones_partidos: basePredictions || {},
        predicciones_finales: baseFinals || {}
      };

      existing.push(newUser);

      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`, existing);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, userId: cleanUserId }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
