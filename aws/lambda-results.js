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

      // --- AUTOMATIC STANDINGS & BRACKET CALCULATION ---
      try {
        const calendario = (await readJSON(BUCKET_NAME, `${PREFIX}/calendario.json`)) || [];
        const existingKnockoutMatches = (await readJSON(BUCKET_NAME, `${PREFIX}/eliminatorias.json`)) || [];
        const updatedKnockout = computeKnockoutBracket(calendario, merged, existingKnockoutMatches);
        
        await writeJSON(BUCKET_NAME, `${PREFIX}/eliminatorias.json`, updatedKnockout);
        await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/eliminatorias.json`]);
      } catch (err) {
        console.error("Error updating bracket automatically:", err);
      }
      // --- END AUTOMATIC BRACKET CALCULATION ---

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
      const { matchId, prediction, predictions } = body;
      
      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`)) || {};
      if (!existing[userId]) existing[userId] = {};

      const knockoutMatches = (await readJSON(BUCKET_NAME, `${PREFIX}/eliminatorias.json`)) || [];
      const results = (await readJSON(BUCKET_NAME, `${PREFIX}/resultados.json`)) || {};
      const now = Date.now();
      const lockThreshold = 10 * 60 * 1000; // 10 minutes in ms

      function isMatchLocked(match) {
        if (!match) return false;
        const res = results[match.id];
        if (res && res.homeGoals != null && res.awayGoals != null) return true;

        if (match.date) {
          try {
            const timeStr = match.time ? (match.time.includes(":") ? match.time : `${match.time}:00`) : "00:00";
            const matchDateTimeStr = `${match.date}T${timeStr}:00-05:00`;
            const matchTime = new Date(matchDateTimeStr).getTime();
            if (now >= (matchTime - lockThreshold)) {
              return true;
            }
          } catch (e) {
            // ignore
          }
        }
        return false;
      }

      if (predictions && typeof predictions === "object") {
        const lockedMatchIds = [];
        Object.keys(predictions).forEach(mId => {
          const match = knockoutMatches.find(m => m.id === mId);
          if (isMatchLocked(match)) {
            lockedMatchIds.push(mId);
          }
        });
        if (lockedMatchIds.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `No se pudieron guardar. Los siguientes partidos están bloqueados: ${lockedMatchIds.join(", ")}` })
          };
        }

        Object.entries(predictions).forEach(([mId, pred]) => {
          existing[userId][mId] = pred;
        });
      } else {
        if (!matchId || !prediction) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing matchId, prediction or predictions" }) };
        }
        const match = knockoutMatches.find(m => m.id === matchId);
        if (isMatchLocked(match)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "El partido está bloqueado para predicciones (comienza en menos de 10 minutos o ya finalizó)" })
          };
        }
        existing[userId][matchId] = prediction;
      }

      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`, existing);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones-eliminatorias.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ===================== saveUserPredictions (any logged-in user, only once) =====================
    if (action === "saveUserPredictions") {
      if (!userId) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      const { predictions } = body;
      if (!predictions || typeof predictions !== "object") {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing predictions" }) };
      }

      // Check if group stage predictions are active in settings
      const settings = (await readJSON(BUCKET_NAME, `${PREFIX}/settings.json`)) || { activePhases: ["grupos"] };
      const activePhases = settings.activePhases || ["grupos"];
      if (!activePhases.includes("grupos")) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "La fase de grupos está bloqueada para predicciones." }) };
      }

      const existing = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`)) || [];
      const userIndex = existing.findIndex(u => u.participante.toLowerCase().replace(/\s+/g, '_') === userId);
      if (userIndex === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Usuario no encontrado" }) };
      }

      const user = existing[userIndex];

      if (user.predictions_edited) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Ya has modificado tus pronósticos una vez y están bloqueados." }) };
      }

      const calendar = (await readJSON(BUCKET_NAME, `${PREFIX}/calendario.json`)) || [];
      const results = (await readJSON(BUCKET_NAME, `${PREFIX}/resultados.json`)) || {};
      const now = Date.now();

      if (!user.predicciones_partidos) user.predicciones_partidos = {};

      for (const [matchId, predVal] of Object.entries(predictions)) {
        if (!predVal || typeof predVal !== "object") continue;
        
        const match = calendar.find(m => m.pred_id === matchId);
        if (!match) continue;

        const res = results[matchId];
        const hasResult = res && res.homeGoals != null && res.awayGoals != null;

        let hasPassed = hasResult;
        if (!hasPassed && match.date && match.time_colombia) {
          try {
            const matchDateTimeStr = `${match.date}T${match.time_colombia}:00-05:00`;
            const matchTime = new Date(matchDateTimeStr).getTime();
            const lockThreshold = 10 * 60 * 1000; // 10 minutes in ms
            if (now >= (matchTime - lockThreshold)) {
              hasPassed = true;
            }
          } catch (e) {
            // ignore
          }
        }

        if (hasPassed) {
          continue; // skip updating past matches
        }

        if (!user.predicciones_partidos[matchId]) {
          user.predicciones_partidos[matchId] = {
            local: match.team_home || match.local,
            visitante: match.team_away || match.visitante
          };
        }
        
        user.predicciones_partidos[matchId].goles_local = predVal.goles_local;
        user.predicciones_partidos[matchId].goles_visitante = predVal.goles_visitante;
      }

      user.predictions_edited = true;
      existing[userIndex] = user;

      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`, existing);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones.json`]);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ===================== adminSaveUserPredictions (admin only, edit any user predictions/finals) =====================
    if (action === "adminSaveUserPredictions") {
      const { adminId, targetUserId, groupPredictions, knockoutPredictions, finals } = body;
      if (!adminId || adminId !== "diego") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      if (!targetUserId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Falta targetUserId" }) };
      }

      // 1. Update group predictions and finals in predicciones.json
      const predictionsList = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`)) || [];
      const userIndex = predictionsList.findIndex(u => u.participante.toLowerCase().replace(/\s+/g, '_') === targetUserId);
      if (userIndex === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Usuario no encontrado" }) };
      }

      const userObj = predictionsList[userIndex];
      
      // Update group predictions if provided
      if (groupPredictions && typeof groupPredictions === "object") {
        if (!userObj.predicciones_partidos) userObj.predicciones_partidos = {};
        Object.entries(groupPredictions).forEach(([mId, pred]) => {
          if (!userObj.predicciones_partidos[mId]) {
            userObj.predicciones_partidos[mId] = {};
          }
          userObj.predicciones_partidos[mId].goles_local = pred.goles_local;
          userObj.predicciones_partidos[mId].goles_visitante = pred.goles_visitante;
        });
      }

      // Update finals if provided
      if (finals && typeof finals === "object") {
        userObj.predicciones_finales = finals;
      }

      predictionsList[userIndex] = userObj;
      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`, predictionsList);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones.json`]);

      // 2. Update knockout predictions in predicciones-eliminatorias.json
      if (knockoutPredictions && typeof knockoutPredictions === "object") {
        const knockoutList = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`)) || {};
        if (!knockoutList[targetUserId]) knockoutList[targetUserId] = {};
        
        Object.entries(knockoutPredictions).forEach(([mId, pred]) => {
          knockoutList[targetUserId][mId] = pred;
        });

        await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`, knockoutList);
        await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones-eliminatorias.json`]);
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ===================== renameUser (admin only) =====================
    if (action === "renameUser") {
      const { adminId, oldUserId, newName } = body;
      if (!adminId || adminId !== "diego") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
      }
      if (!oldUserId || !newName) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Faltan datos" }) };
      }
      const newUserId = newName.toLowerCase().replace(/\s+/g, '_');

      // 1. Update predicciones.json
      const predictionsList = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`)) || [];
      const userIndex = predictionsList.findIndex(u => u.participante.toLowerCase().replace(/\s+/g, '_') === oldUserId);
      if (userIndex === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Usuario no encontrado" }) };
      }

      predictionsList[userIndex].participante = newName;
      await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones.json`, predictionsList);
      await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones.json`]);

      // 2. Update predicciones-eliminatorias.json
      const knockoutList = (await readJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`)) || {};
      if (knockoutList[oldUserId]) {
        knockoutList[newUserId] = knockoutList[oldUserId];
        delete knockoutList[oldUserId];
        await writeJSON(BUCKET_NAME, `${PREFIX}/predicciones-eliminatorias.json`, knockoutList);
        await invalidate(CLOUDFRONT_DISTRIBUTION_ID, [`/${PREFIX}/predicciones-eliminatorias.json`]);
      }

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

// ===================== BRACKET COMPUTATION HELPERS =====================

function resolveTiesRecursively(teamsList, groupMatches, resultados, generalStats) {
  if (teamsList.length <= 1) return teamsList;

  const h2hStats = {};
  teamsList.forEach(t => {
    h2hStats[t] = { pts: 0, gd: 0, gs: 0 };
  });

  groupMatches.forEach(m => {
    const result = resultados[m.pred_id];
    if (!result || result.status !== 'finished' || result.homeGoals == null || result.awayGoals == null) {
      return;
    }
    const homeIsLocal = m.home_is_pred_local !== false;
    const localTeam = homeIsLocal ? m.team_home : m.team_away;
    const awayTeam = homeIsLocal ? m.team_away : m.team_home;

    if (teamsList.includes(localTeam) && teamsList.includes(awayTeam)) {
      const homeGoals = result.homeGoals;
      const awayGoals = result.awayGoals;

      h2hStats[localTeam].gs += homeGoals;
      h2hStats[localTeam].gd += (homeGoals - awayGoals);
      h2hStats[awayTeam].gs += awayGoals;
      h2hStats[awayTeam].gd += (awayGoals - homeGoals);

      if (homeGoals > awayGoals) {
        h2hStats[localTeam].pts += 3;
      } else if (homeGoals < awayGoals) {
        h2hStats[awayTeam].pts += 3;
      } else {
        h2hStats[localTeam].pts += 1;
        h2hStats[awayTeam].pts += 1;
      }
    }
  });

  const byH2hPts = {};
  teamsList.forEach(t => {
    const pts = h2hStats[t].pts;
    if (!byH2hPts[pts]) byH2hPts[pts] = [];
    byH2hPts[pts].push(t);
  });

  const sortedH2hPtsKeys = Object.keys(byH2hPts).map(Number).sort((a, b) => b - a);

  if (sortedH2hPtsKeys.length > 1) {
    let result = [];
    sortedH2hPtsKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hPts[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  const byH2hGd = {};
  teamsList.forEach(t => {
    const gd = h2hStats[t].gd;
    if (!byH2hGd[gd]) byH2hGd[gd] = [];
    byH2hGd[gd].push(t);
  });

  const sortedH2hGdKeys = Object.keys(byH2hGd).map(Number).sort((a, b) => b - a);

  if (sortedH2hGdKeys.length > 1) {
    let result = [];
    sortedH2hGdKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hGd[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  const byH2hGs = {};
  teamsList.forEach(t => {
    const gs = h2hStats[t].gs;
    if (!byH2hGs[gs]) byH2hGs[gs] = [];
    byH2hGs[gs].push(t);
  });

  const sortedH2hGsKeys = Object.keys(byH2hGs).map(Number).sort((a, b) => b - a);

  if (sortedH2hGsKeys.length > 1) {
    let result = [];
    sortedH2hGsKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hGs[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  const sortedByGeneral = [...teamsList].sort((a, b) => {
    if (generalStats[b].dg !== generalStats[a].dg) {
      return generalStats[b].dg - generalStats[a].dg;
    }
    if (generalStats[b].gf !== generalStats[a].gf) {
      return generalStats[b].gf - generalStats[a].gf;
    }
    return a.localeCompare(b);
  });

  return sortedByGeneral;
}

function sortGroupStandings(groupName, teams, groupMatches, resultados, generalStats) {
  const groupsByPoints = {};
  teams.forEach(team => {
    const pts = generalStats[team].pts;
    if (!groupsByPoints[pts]) groupsByPoints[pts] = [];
    groupsByPoints[pts].push(team);
  });

  const sortedPointsKeys = Object.keys(groupsByPoints).map(Number).sort((a, b) => b - a);

  let finalSortedTeams = [];
  sortedPointsKeys.forEach(pts => {
    const tied = groupsByPoints[pts];
    const resolved = resolveTiesRecursively(tied, groupMatches, resultados, generalStats);
    finalSortedTeams = finalSortedTeams.concat(resolved);
  });

  return finalSortedTeams.map(t => generalStats[t]);
}

function getStandingsAndQualified(calendario, resultados) {
  const groupTeams = {};
  const groupMatches = {};
  
  calendario.forEach(m => {
    if (m.group) {
      const isKnockout = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"].includes(m.group.toUpperCase());
      if (!isKnockout) {
        if (!groupTeams[m.group]) {
          groupTeams[m.group] = [];
          groupMatches[m.group] = [];
        }
        if (!groupTeams[m.group].includes(m.team_home)) groupTeams[m.group].push(m.team_home);
        if (!groupTeams[m.group].includes(m.team_away)) groupTeams[m.group].push(m.team_away);
        groupMatches[m.group].push(m);
      }
    }
  });

  const generalStats = {};
  for (const groupName in groupTeams) {
    groupTeams[groupName].forEach(teamName => {
      generalStats[teamName] = {
        name: teamName,
        group: groupName,
        pj: 0,
        pts: 0,
        gf: 0,
        gc: 0,
        dg: 0
      };
    });
  }

  calendario.forEach(m => {
    const result = resultados[m.pred_id];
    if (!result || result.status !== 'finished' || result.homeGoals == null || result.awayGoals == null) {
      return;
    }
    const homeIsLocal = m.home_is_pred_local !== false;
    const localTeam = homeIsLocal ? m.team_home : m.team_away;
    const awayTeam = homeIsLocal ? m.team_away : m.team_home;

    const homeGoals = result.homeGoals;
    const awayGoals = result.awayGoals;

    const homeStats = generalStats[localTeam];
    const awayStats = generalStats[awayTeam];

    if (!homeStats || !awayStats) return;

    homeStats.pj += 1;
    awayStats.pj += 1;
    homeStats.gf += homeGoals;
    homeStats.gc += awayGoals;
    awayStats.gf += awayGoals;
    awayStats.gc += homeGoals;

    if (homeGoals > awayGoals) {
      homeStats.pts += 3;
    } else if (homeGoals < awayGoals) {
      awayStats.pts += 3;
    } else {
      homeStats.pts += 1;
      awayStats.pts += 1;
    }
  });

  for (const teamName in generalStats) {
    generalStats[teamName].dg = generalStats[teamName].gf - generalStats[teamName].gc;
  }

  const standings = {};
  const qualified1st = {};
  const qualified2nd = {};
  const thirds = [];

  const groupNames = Object.keys(groupTeams).sort();
  groupNames.forEach(groupName => {
    const sorted = sortGroupStandings(groupName, groupTeams[groupName], groupMatches[groupName], resultados, generalStats);
    standings[groupName] = sorted;

    if (sorted[0]) qualified1st[groupName] = sorted[0];
    if (sorted[1]) qualified2nd[groupName] = sorted[1];
    if (sorted[2]) thirds.push(sorted[2]);
  });

  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  const bestThirds = thirds.slice(0, 8);

  return {
    standings,
    qualified1st,
    qualified2nd,
    thirds,
    bestThirds
  };
}

function assignThirdsToSlots(bestThirds) {
  const slots = [
    { id: "16v_3", name: "1E", allowed: ["D", "C", "B", "A", "F"] },
    { id: "16v_6", name: "1I", allowed: ["F", "G", "H", "D", "C"] },
    { id: "16v_7", name: "1A", allowed: ["C", "E", "F", "H", "I"] },
    { id: "16v_8", name: "1L", allowed: ["E", "H", "I", "J", "K"] },
    { id: "16v_10", name: "1D", allowed: ["B", "E", "F", "I", "J"] },
    { id: "16v_9", name: "1G", allowed: ["A", "E", "H", "I", "J"] },
    { id: "16v_13", name: "1B", allowed: ["J", "E", "F", "G", "I"] },
    { id: "16v_16", name: "1K", allowed: ["L", "D", "E", "I", "J"] }
  ];

  const assignment = new Array(slots.length).fill(null);
  const used = new Array(bestThirds.length).fill(false);

  function backtrack(slotIdx) {
    if (slotIdx === slots.length) return true;

    const slot = slots[slotIdx];
    for (const groupOpt of slot.allowed) {
      for (let i = 0; i < bestThirds.length; i++) {
        if (!used[i] && bestThirds[i].group === groupOpt) {
          used[i] = true;
          assignment[slotIdx] = bestThirds[i];
          if (backtrack(slotIdx + 1)) return true;
          used[i] = false;
          assignment[slotIdx] = null;
        }
      }
    }
    return false;
  }

  const success = backtrack(0);
  if (success) {
    return slots.map((slot, idx) => ({
      slotId: slot.id,
      slotName: slot.name,
      team: assignment[idx]
    }));
  }
  return null;
}

function assignThirdsWithFallback(bestThirds) {
  const result = assignThirdsToSlots(bestThirds);
  if (result) return result;

  const slots = [
    { id: "16v_3", name: "1E", allowed: ["D", "C", "B", "A", "F"] },
    { id: "16v_6", name: "1I", allowed: ["F", "G", "H", "D", "C"] },
    { id: "16v_7", name: "1A", allowed: ["C", "E", "F", "H", "I"] },
    { id: "16v_8", name: "1L", allowed: ["E", "H", "I", "J", "K"] },
    { id: "16v_10", name: "1D", allowed: ["B", "E", "F", "I", "J"] },
    { id: "16v_9", name: "1G", allowed: ["A", "E", "H", "I", "J"] },
    { id: "16v_13", name: "1B", allowed: ["J", "E", "F", "G", "I"] },
    { id: "16v_16", name: "1K", allowed: ["L", "D", "E", "I", "J"] }
  ];

  const matched = [];
  const assignedThirds = new Set();

  slots.forEach(slot => {
    const match = bestThirds.find(t => slot.allowed.includes(t.group) && !assignedThirds.has(t.name));
    if (match) {
      matched.push({ slotId: slot.id, slotName: slot.name, team: match });
      assignedThirds.add(match.name);
    } else {
      const anyMatch = bestThirds.find(t => !assignedThirds.has(t.name));
      if (anyMatch) {
        matched.push({ slotId: slot.id, slotName: slot.name, team: anyMatch });
        assignedThirds.add(anyMatch.name);
      } else {
        matched.push({
          slotId: slot.id,
          slotName: slot.name,
          team: { name: `3° ${slot.allowed.join('/')}`, group: '?' }
        });
      }
    }
  });

  return matched;
}

function computeKnockoutBracket(calendario, resultados, existingKnockoutMatches) {
  const { qualified1st, qualified2nd, bestThirds } = getStandingsAndQualified(calendario, resultados);

  const thirdsAssignments = assignThirdsWithFallback(bestThirds);
  const thirdsBySlotId = {};
  thirdsAssignments.forEach(a => {
    thirdsBySlotId[a.slotId] = a.team;
  });

  const r32Sources = {
    "16v_1": {
      // Bracket A: Sudáfrica vs Canadá (2A vs 2B)
      local: () => qualified2nd["A"]?.name || "2° Grupo A",
      visitante: () => qualified2nd["B"]?.name || "2° Grupo B"
    },
    "16v_2": {
      // Bracket B: Brasil vs Japón (1C vs 2F)
      local: () => qualified1st["C"]?.name || "1° Grupo C",
      visitante: () => qualified2nd["F"]?.name || "2° Grupo F"
    },
    "16v_3": {
      // Bracket C: Alemania vs Paraguay (1E vs 1E_third)
      local: () => qualified1st["E"]?.name || "1° Grupo E",
      visitante: () => thirdsBySlotId["16v_3"]?.name || "3° A/B/C/D/F"
    },
    "16v_4": {
      // Bracket D: Países Bajos vs Marruecos (1F vs 2C)
      local: () => qualified1st["F"]?.name || "1° Grupo F",
      visitante: () => qualified2nd["C"]?.name || "2° Grupo C"
    },
    "16v_5": {
      // Bracket E: Costa de Marfil vs Noruega (2E vs 2I)
      local: () => qualified2nd["E"]?.name || "2° Grupo E",
      visitante: () => qualified2nd["I"]?.name || "2° Grupo I"
    },
    "16v_6": {
      // Bracket F: Francia vs Suecia (1I vs 1I_third)
      local: () => qualified1st["I"]?.name || "1° Grupo I",
      visitante: () => thirdsBySlotId["16v_6"]?.name || "3° C/D/F/G/H"
    },
    "16v_7": {
      // Bracket G: México vs Ecuador (1A vs 1A_third)
      local: () => qualified1st["A"]?.name || "1° Grupo A",
      visitante: () => thirdsBySlotId["16v_7"]?.name || "3° C/E/F/H/I"
    },
    "16v_8": {
      // Bracket H: Inglaterra vs RD Congo (1L vs 1L_third)
      local: () => qualified1st["L"]?.name || "1° Grupo L",
      visitante: () => thirdsBySlotId["16v_8"]?.name || "3° E/H/I/J/K"
    },
    "16v_9": {
      // Bracket I: Bélgica vs Senegal (1G vs 1G_third)
      local: () => qualified1st["G"]?.name || "1° Grupo G",
      visitante: () => thirdsBySlotId["16v_9"]?.name || "3° A/E/H/I/J"
    },
    "16v_10": {
      // Bracket J: Estados Unidos vs Bosnia (1D vs 1D_third)
      local: () => qualified1st["D"]?.name || "1° Grupo D",
      visitante: () => thirdsBySlotId["16v_10"]?.name || "3° B/E/F/I/J"
    },
    "16v_11": {
      // Bracket K: España vs Austria (1H vs 2J)
      local: () => qualified1st["H"]?.name || "1° Grupo H",
      visitante: () => qualified2nd["J"]?.name || "2° Grupo J"
    },
    "16v_12": {
      // Bracket L: Portugal vs Croacia (2K vs 2L)
      local: () => qualified2nd["K"]?.name || "2° Grupo K",
      visitante: () => qualified2nd["L"]?.name || "2° Grupo L"
    },
    "16v_13": {
      // Bracket M: Suiza vs Argelia (1B vs 1B_third)
      local: () => qualified1st["B"]?.name || "1° Grupo B",
      visitante: () => thirdsBySlotId["16v_13"]?.name || "3° E/F/G/I/J"
    },
    "16v_14": {
      // Bracket N: Australia vs Egipto (2D vs 2G)
      local: () => qualified2nd["D"]?.name || "2° Grupo D",
      visitante: () => qualified2nd["G"]?.name || "2° Grupo G"
    },
    "16v_15": {
      // Bracket O: Argentina vs Cabo Verde (1J vs 2H)
      local: () => qualified1st["J"]?.name || "1° Grupo J",
      visitante: () => qualified2nd["H"]?.name || "2° Grupo H"
    },
    "16v_16": {
      // Bracket P: Colombia vs Ghana (1K vs 1K_third)
      local: () => qualified1st["K"]?.name || "1° Grupo K",
      visitante: () => thirdsBySlotId["16v_16"]?.name || "3° D/E/I/J/L"
    }
  };

  function createDefaultMatches() {
    const list = [];
    
    // 16vos
    const r32Schedule = [
      { date: "2026-06-28", time: "14:00" }, // 16v_1
      { date: "2026-06-29", time: "12:00" }, // 16v_2
      { date: "2026-06-29", time: "15:30" }, // 16v_3
      { date: "2026-06-29", time: "20:00" }, // 16v_4
      { date: "2026-06-30", time: "12:00" }, // 16v_5
      { date: "2026-06-30", time: "16:00" }, // 16v_6
      { date: "2026-06-30", time: "20:00" }, // 16v_7
      { date: "2026-07-01", time: "11:00" }, // 16v_8
      { date: "2026-07-01", time: "15:00" }, // 16v_9
      { date: "2026-07-01", time: "19:00" }, // 16v_10
      { date: "2026-07-02", time: "14:00" }, // 16v_11
      { date: "2026-07-02", time: "18:00" }, // 16v_12
      { date: "2026-07-02", time: "22:00" }, // 16v_13
      { date: "2026-07-03", time: "13:00" }, // 16v_14
      { date: "2026-07-03", time: "17:00" }, // 16v_15
      { date: "2026-07-03", time: "20:30" }  // 16v_16
    ];

    for (let i = 1; i <= 16; i++) {
      const schedule = r32Schedule[i - 1];
      list.push({
        id: `16v_${i}`,
        phase: "16vos",
        group: "16VOS",
        local: "",
        visitante: "",
        date: schedule.date,
        time: schedule.time
      });
    }

    // Octavos
    const r16Schedule = [
      { date: "2026-07-04", time: "12:00" }, // 8v_1
      { date: "2026-07-04", time: "16:00" }, // 8v_2
      { date: "2026-07-05", time: "12:00" }, // 8v_3
      { date: "2026-07-05", time: "16:00" }, // 8v_4
      { date: "2026-07-06", time: "12:00" }, // 8v_5
      { date: "2026-07-06", time: "16:00" }, // 8v_6
      { date: "2026-07-07", time: "12:00" }, // 8v_7
      { date: "2026-07-07", time: "16:00" }  // 8v_8
    ];

    for (let i = 1; i <= 8; i++) {
      const schedule = r16Schedule[i - 1];
      list.push({
        id: `8v_${i}`,
        phase: "octavos",
        group: "OCTAVOS",
        local: "",
        visitante: "",
        date: schedule.date,
        time: schedule.time
      });
    }

    // Cuartos
    const qfSchedule = [
      { date: "2026-07-09", time: "15:00" }, // 4v_1
      { date: "2026-07-10", time: "15:00" }, // 4v_2
      { date: "2026-07-11", time: "15:00" }, // 4v_3
      { date: "2026-07-12", time: "15:00" }  // 4v_4
    ];

    for (let i = 1; i <= 4; i++) {
      const schedule = qfSchedule[i - 1];
      list.push({
        id: `4v_${i}`,
        phase: "cuartos",
        group: "CUARTOS",
        local: "",
        visitante: "",
        date: schedule.date,
        time: schedule.time
      });
    }

    // Semis
    const sfSchedule = [
      { date: "2026-07-14", time: "19:00" }, // sf_1
      { date: "2026-07-15", time: "19:00" }  // sf_2
    ];

    for (let i = 1; i <= 2; i++) {
      const schedule = sfSchedule[i - 1];
      list.push({
        id: `sf_${i}`,
        phase: "semis",
        group: "SEMIS",
        local: "",
        visitante: "",
        date: schedule.date,
        time: schedule.time
      });
    }

    // Finales
    list.push({
      id: "fin_1",
      phase: "final",
      group: "FINAL",
      local: "",
      visitante: "",
      date: "2026-07-19",
      time: "14:00" // Gran Final: 2:00 PM (COT)
    });
    list.push({
      id: "fin_2",
      phase: "final",
      group: "FINAL",
      local: "",
      visitante: "",
      date: "2026-07-18",
      time: "21:00" // Tercer puesto: 9:00 PM (COT)
    });

    return list;
  }

  const matchesMap = {};
  const defaults = createDefaultMatches();
  defaults.forEach(m => {
    matchesMap[m.id] = m;
  });

  if (Array.isArray(existingKnockoutMatches) && existingKnockoutMatches.length > 0) {
    existingKnockoutMatches.forEach(m => {
      if (m && m.id) {
        const defaultMatch = matchesMap[m.id];
        matchesMap[m.id] = {
          ...defaultMatch,
          ...m,
          date: defaultMatch ? defaultMatch.date : m.date,
          time: defaultMatch ? defaultMatch.time : m.time
        };
      }
    });
  }

  function getWinner(matchId) {
    const res = resultados[matchId];
    const m = matchesMap[matchId];
    if (!res || res.status !== "finished" || res.homeGoals == null || res.awayGoals == null || !m) {
      const matchNum = matchId.split('_')[1] || matchId;
      return `Winner ${m?.phase === 'semis' ? 'SF' : m?.phase === 'cuartos' ? 'Cuartos' : m?.phase === 'octavos' ? 'Octavos' : '16vos'} ${matchNum}`;
    }
    if (res.homeGoals > res.awayGoals) return m.local;
    if (res.awayGoals > res.homeGoals) return m.visitante;
    if (res.teamPasses === "home") return m.local;
    if (res.teamPasses === "away") return m.visitante;
    return `Winner ${matchId}`;
  }

  function getLoser(matchId) {
    const res = resultados[matchId];
    const m = matchesMap[matchId];
    if (!res || res.status !== "finished" || res.homeGoals == null || res.awayGoals == null || !m) {
      const matchNum = matchId.split('_')[1] || matchId;
      return `Loser ${m?.phase === 'semis' ? 'SF' : m?.phase === 'cuartos' ? 'Cuartos' : m?.phase === 'octavos' ? 'Octavos' : '16vos'} ${matchNum}`;
    }
    if (res.homeGoals > res.awayGoals) return m.visitante;
    if (res.awayGoals > res.homeGoals) return m.local;
    if (res.teamPasses === "home") return m.visitante;
    if (res.teamPasses === "away") return m.local;
    return `Loser ${matchId}`;
  }

  for (let i = 1; i <= 16; i++) {
    const matchId = `16v_${i}`;
    const m = matchesMap[matchId];
    const source = r32Sources[matchId];
    if (m && source) {
      m.local = source.local();
      m.visitante = source.visitante();
    }
  }

  for (let i = 1; i <= 8; i++) {
    const m = matchesMap[`8v_${i}`];
    if (m) {
      m.local = getWinner(`16v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`16v_${(i-1)*2 + 2}`);
    }
  }

  for (let i = 1; i <= 4; i++) {
    const m = matchesMap[`4v_${i}`];
    if (m) {
      m.local = getWinner(`8v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`8v_${(i-1)*2 + 2}`);
    }
  }

  for (let i = 1; i <= 2; i++) {
    const m = matchesMap[`sf_${i}`];
    if (m) {
      m.local = getWinner(`4v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`4v_${(i-1)*2 + 2}`);
    }
  }

  const fin1 = matchesMap["fin_1"];
  if (fin1) {
    fin1.local = getWinner("sf_1");
    fin1.visitante = getWinner("sf_2");
  }
  const fin2 = matchesMap["fin_2"];
  if (fin2) {
    fin2.local = getLoser("sf_1");
    fin2.visitante = getLoser("sf_2");
  }

  return Object.values(matchesMap).sort((a, b) => {
    const phases = ["16vos", "octavos", "cuartos", "semis", "final"];
    const rA = phases.indexOf(a.phase);
    const rB = phases.indexOf(b.phase);
    if (rA !== rB) return rA - rB;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

