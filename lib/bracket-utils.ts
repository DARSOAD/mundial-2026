// lib/bracket-utils.ts

export interface TeamStats {
  name: string;
  group: string;
  pj: number;
  pts: number;
  gf: number;
  gc: number;
  dg: number;
}

export interface GroupStanding {
  group: string;
  teams: TeamStats[];
}

export interface ThirdsSlotAssignment {
  slotId: string;
  slotName: string;
  team: TeamStats;
}

/**
 * Resuelve los empates en puntos de manera recursiva basándose en criterios H2H (1-3)
 * y luego cae en criterios generales del grupo (4 y 5) en caso de persistir el empate.
 */
function resolveTiesRecursively(
  teamsList: string[],
  groupMatches: any[],
  resultados: Record<string, any>,
  generalStats: Record<string, TeamStats>
): string[] {
  if (teamsList.length <= 1) return teamsList;

  // 1. Calcular estadísticas de enfrentamiento directo (H2H) para este subgrupo de equipos
  const h2hStats: Record<string, { pts: number; gd: number; gs: number }> = {};
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

    // Solo contamos el partido si ambos equipos están en el subgrupo de empatados
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

  // 2. Agrupar por puntos H2H (Criterio 1)
  const byH2hPts: Record<number, string[]> = {};
  teamsList.forEach(t => {
    const pts = h2hStats[t].pts;
    if (!byH2hPts[pts]) byH2hPts[pts] = [];
    byH2hPts[pts].push(t);
  });

  const sortedH2hPtsKeys = Object.keys(byH2hPts).map(Number).sort((a, b) => b - a);

  // Si los puntos H2H rompieron el empate total o parcialmente
  if (sortedH2hPtsKeys.length > 1) {
    let result: string[] = [];
    sortedH2hPtsKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hPts[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  // 3. Agrupar por Diferencia de Goles H2H (Criterio 2)
  const byH2hGd: Record<number, string[]> = {};
  teamsList.forEach(t => {
    const gd = h2hStats[t].gd;
    if (!byH2hGd[gd]) byH2hGd[gd] = [];
    byH2hGd[gd].push(t);
  });

  const sortedH2hGdKeys = Object.keys(byH2hGd).map(Number).sort((a, b) => b - a);

  if (sortedH2hGdKeys.length > 1) {
    let result: string[] = [];
    sortedH2hGdKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hGd[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  // 4. Agrupar por Goles Anotados H2H (Criterio 3)
  const byH2hGs: Record<number, string[]> = {};
  teamsList.forEach(t => {
    const gs = h2hStats[t].gs;
    if (!byH2hGs[gs]) byH2hGs[gs] = [];
    byH2hGs[gs].push(t);
  });

  const sortedH2hGsKeys = Object.keys(byH2hGs).map(Number).sort((a, b) => b - a);

  if (sortedH2hGsKeys.length > 1) {
    let result: string[] = [];
    sortedH2hGsKeys.forEach(key => {
      result = result.concat(resolveTiesRecursively(byH2hGs[key], groupMatches, resultados, generalStats));
    });
    return result;
  }

  // 5. Criterios Generales del Grupo (Criterios 4 y 5) + Fallback Alfabético
  const sortedByGeneral = [...teamsList].sort((a, b) => {
    // 4. Mejor diferencia de goles general
    if (generalStats[b].dg !== generalStats[a].dg) {
      return generalStats[b].dg - generalStats[a].dg;
    }
    // 5. Mayor cantidad de goles general
    if (generalStats[b].gf !== generalStats[a].gf) {
      return generalStats[b].gf - generalStats[a].gf;
    }
    // Desempate por nombre (para mantener el orden consistente)
    return a.localeCompare(b);
  });

  return sortedByGeneral;
}

/**
 * Ordena los equipos de un grupo específico
 */
export function sortGroupStandings(
  groupName: string,
  teams: string[],
  groupMatches: any[],
  resultados: Record<string, any>,
  generalStats: Record<string, TeamStats>
): TeamStats[] {
  // Agrupar a los 4 equipos por sus puntos generales
  const groupsByPoints: Record<number, string[]> = {};
  teams.forEach(team => {
    const pts = generalStats[team].pts;
    if (!groupsByPoints[pts]) groupsByPoints[pts] = [];
    groupsByPoints[pts].push(team);
  });

  const sortedPointsKeys = Object.keys(groupsByPoints).map(Number).sort((a, b) => b - a);

  let finalSortedTeams: string[] = [];
  sortedPointsKeys.forEach(pts => {
    const tied = groupsByPoints[pts];
    const resolved = resolveTiesRecursively(tied, groupMatches, resultados, generalStats);
    finalSortedTeams = finalSortedTeams.concat(resolved);
  });

  return finalSortedTeams.map(t => generalStats[t]);
}

/**
 * Calcula la tabla de posiciones general de los grupos y determina los clasificados
 */
export function getStandingsAndQualified(calendario: any[], resultados: Record<string, any>) {
  const groupTeams: Record<string, string[]> = {};
  const groupMatches: Record<string, any[]> = {};
  
  calendario.forEach(m => {
    if (m.group) {
      // Filtrar partidos que pertenezcan a fase de grupos
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

  // Inicializar estadísticas generales
  const generalStats: Record<string, TeamStats> = {};
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

  // Calcular goles e información general de cada partido
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

  // Ordenar grupos y extraer clasificados
  const standings: Record<string, TeamStats[]> = {};
  const qualified1st: Record<string, TeamStats> = {};
  const qualified2nd: Record<string, TeamStats> = {};
  const thirds: TeamStats[] = [];

  const groupNames = Object.keys(groupTeams).sort(); // A, B, C, D, E, F, G, H, I, J, K, L
  groupNames.forEach(groupName => {
    const sorted = sortGroupStandings(groupName, groupTeams[groupName], groupMatches[groupName], resultados, generalStats);
    standings[groupName] = sorted;

    if (sorted[0]) qualified1st[groupName] = sorted[0];
    if (sorted[1]) qualified2nd[groupName] = sorted[1];
    if (sorted[2]) thirds.push(sorted[2]);
  });

  // Ordenar la tabla de terceros (Solo criterios generales)
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

/**
 * Asigna los 8 mejores terceros a las llaves usando Backtracking
 */
export function assignThirdsToSlots(bestThirds: TeamStats[]): ThirdsSlotAssignment[] | null {
  const slots = [
    { id: "16v_2", name: "1E", allowed: ["D", "C", "B", "A", "F"] },
    { id: "16v_5", name: "1I", allowed: ["F", "H", "G", "D", "C"] },
    { id: "16v_7", name: "1A", allowed: ["C", "E", "F", "G", "I"] },
    { id: "16v_8", name: "1L", allowed: ["E", "G", "I", "J", "K"] },
    { id: "16v_9", name: "1D", allowed: ["B", "E", "F", "I", "J"] },
    { id: "16v_10", name: "1H", allowed: ["A", "E", "G", "I", "J"] },
    { id: "16v_13", name: "1B", allowed: ["J", "E", "F", "H", "I"] },
    { id: "16v_15", name: "1K", allowed: ["L", "D", "E", "I", "J"] }
  ];

  const assignment = new Array(slots.length).fill(null);
  const used = new Array(bestThirds.length).fill(false);

  function backtrack(slotIdx: number): boolean {
    if (slotIdx === slots.length) return true;

    const slot = slots[slotIdx];
    for (const groupOpt of slot.allowed) {
      for (let i = 0; i < bestThirds.length; i++) {
        if (!used[i] && bestThirds[i].group === groupOpt) {
          used[i] = true;
          assignment[slotIdx] = bestThirds[i];
          if (backtrack(slotIdx + 1)) return true;
          // Backtrack
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

/**
 * Asignador con fallback para asegurar que siempre retorne resultados válidos
 */
export function assignThirdsWithFallback(bestThirds: TeamStats[]): ThirdsSlotAssignment[] {
  const result = assignThirdsToSlots(bestThirds);
  if (result) return result;

  const slots = [
    { id: "16v_2", name: "1E", allowed: ["D", "C", "B", "A", "F"] },
    { id: "16v_5", name: "1I", allowed: ["F", "H", "G", "D", "C"] },
    { id: "16v_7", name: "1A", allowed: ["C", "E", "F", "G", "I"] },
    { id: "16v_8", name: "1L", allowed: ["E", "G", "I", "J", "K"] },
    { id: "16v_9", name: "1D", allowed: ["B", "E", "F", "I", "J"] },
    { id: "16v_10", name: "1H", allowed: ["A", "E", "G", "I", "J"] },
    { id: "16v_13", name: "1B", allowed: ["J", "E", "F", "H", "I"] },
    { id: "16v_15", name: "1K", allowed: ["L", "D", "E", "I", "J"] }
  ];

  const matched: ThirdsSlotAssignment[] = [];
  const assignedThirds = new Set<string>();

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
          team: { name: `3° ${slot.allowed.join('/')}`, group: '?', pj: 0, pts: 0, gf: 0, gc: 0, dg: 0 }
        });
      }
    }
  });

  return matched;
}

/**
 * Calcula y propaga todo el árbol del bracket de eliminación directa
 */
export function computeKnockoutBracket(
  calendario: any[],
  resultados: Record<string, any>,
  existingKnockoutMatches: any[]
): any[] {
  // 1. Obtener standing y clasificados
  const { qualified1st, qualified2nd, bestThirds } = getStandingsAndQualified(calendario, resultados);

  // 2. Resolver asignaciones de mejores terceros a cada llave de 16vos
  const thirdsAssignments = assignThirdsWithFallback(bestThirds);
  const thirdsBySlotId: Record<string, TeamStats> = {};
  thirdsAssignments.forEach(a => {
    thirdsBySlotId[a.slotId] = a.team;
  });

  // 3. Orígenes fijos de 16vos (Round of 32)
  const r32Sources: Record<string, { local: () => string; visitante: () => string }> = {
    "16v_1": {
      local: () => qualified2nd["A"]?.name || "2° Grupo A",
      visitante: () => qualified2nd["B"]?.name || "2° Grupo B"
    },
    "16v_2": {
      local: () => qualified1st["E"]?.name || "1° Grupo E",
      visitante: () => thirdsBySlotId["16v_2"]?.name || "3° A/B/C/D/F"
    },
    "16v_3": {
      local: () => qualified1st["F"]?.name || "1° Grupo F",
      visitante: () => qualified2nd["C"]?.name || "2° Grupo C"
    },
    "16v_4": {
      local: () => qualified1st["C"]?.name || "1° Grupo C",
      visitante: () => qualified2nd["F"]?.name || "2° Grupo F"
    },
    "16v_5": {
      local: () => qualified1st["I"]?.name || "1° Grupo I",
      visitante: () => thirdsBySlotId["16v_5"]?.name || "3° C/D/F/G/H"
    },
    "16v_6": {
      local: () => qualified2nd["E"]?.name || "2° Grupo E",
      visitante: () => qualified2nd["I"]?.name || "2° Grupo I"
    },
    "16v_7": {
      local: () => qualified1st["A"]?.name || "1° Grupo A",
      visitante: () => thirdsBySlotId["16v_7"]?.name || "3° C/E/F/H/I"
    },
    "16v_8": {
      local: () => qualified1st["L"]?.name || "1° Grupo L",
      visitante: () => thirdsBySlotId["16v_8"]?.name || "3° E/H/I/J/K"
    },
    "16v_9": {
      local: () => qualified1st["D"]?.name || "1° Grupo D",
      visitante: () => thirdsBySlotId["16v_9"]?.name || "3° B/E/F/I/J"
    },
    "16v_10": {
      local: () => qualified1st["H"]?.name || "1° Grupo H",
      visitante: () => thirdsBySlotId["16v_10"]?.name || "3° A/E/G/I/J"
    },
    "16v_11": {
      local: () => qualified2nd["K"]?.name || "2° Grupo K",
      visitante: () => qualified2nd["L"]?.name || "2° Grupo L"
    },
    "16v_12": {
      local: () => qualified1st["G"]?.name || "1° Grupo G",
      visitante: () => qualified2nd["J"]?.name || "2° Grupo J"
    },
    "16v_13": {
      local: () => qualified1st["B"]?.name || "1° Grupo B",
      visitante: () => thirdsBySlotId["16v_13"]?.name || "3° E/F/H/I/J"
    },
    "16v_14": {
      local: () => qualified1st["J"]?.name || "1° Grupo J",
      visitante: () => qualified2nd["G"]?.name || "2° Grupo G"
    },
    "16v_15": {
      local: () => qualified1st["K"]?.name || "1° Grupo K",
      visitante: () => thirdsBySlotId["16v_15"]?.name || "3° D/E/I/J/L"
    },
    "16v_16": {
      local: () => qualified2nd["D"]?.name || "2° Grupo D",
      visitante: () => qualified2nd["H"]?.name || "2° Grupo H"
    }
  };

  // Helper para inicializar partidos por defecto si no existen
  function createDefaultMatches(): any[] {
    const list: any[] = [];
    
    // 16vos
    for (let i = 1; i <= 16; i++) {
      list.push({
        id: `16v_${i}`,
        phase: "16vos",
        group: "16VOS",
        local: "",
        visitante: "",
        date: `2026-06-${27 + Math.ceil(i/4)}`,
        time: `${12 + (i % 4) * 3}:00`
      });
    }

    // Octavos
    for (let i = 1; i <= 8; i++) {
      list.push({
        id: `8v_${i}`,
        phase: "octavos",
        group: "OCTAVOS",
        local: "",
        visitante: "",
        date: `2026-07-${1 + Math.ceil(i/2)}`,
        time: `${12 + (i % 2) * 4}:00`
      });
    }

    // Cuartos
    for (let i = 1; i <= 4; i++) {
      list.push({
        id: `4v_${i}`,
        phase: "cuartos",
        group: "CUARTOS",
        local: "",
        visitante: "",
        date: `2026-07-${4 + Math.ceil(i/2)}`,
        time: `${14 + (i % 2) * 4}:00`
      });
    }

    // Semis
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `sf_${i}`,
        phase: "semis",
        group: "SEMIS",
        local: "",
        visitante: "",
        date: `2026-07-08`,
        time: `16:00`
      });
    }

    // Finales
    list.push({
      id: "fin_1",
      phase: "final",
      group: "FINAL",
      local: "",
      visitante: "",
      date: "2026-07-12",
      time: "16:00"
    });
    list.push({
      id: "fin_2",
      phase: "final",
      group: "FINAL",
      local: "",
      visitante: "",
      date: "2026-07-11",
      time: "16:00"
    });

    return list;
  }

  // Inicializar mapa de partidos
  const matchesMap: Record<string, any> = {};
  const defaults = createDefaultMatches();
  
  defaults.forEach(m => {
    matchesMap[m.id] = m;
  });

  // Sobrescribir con lo que ya exista en base de datos/S3
  if (Array.isArray(existingKnockoutMatches) && existingKnockoutMatches.length > 0) {
    existingKnockoutMatches.forEach(m => {
      if (m && m.id) {
        matchesMap[m.id] = { ...matchesMap[m.id], ...m };
      }
    });
  }

  // Helper para resolver ganador/perdedor
  function getWinner(matchId: string): string {
    const res = resultados[matchId];
    const m = matchesMap[matchId];
    if (!res || res.status !== "finished" || res.homeGoals == null || res.awayGoals == null || !m) {
      const matchNum = matchId.split('_')[1] || matchId;
      return `Ganador ${m?.phase === 'semis' ? 'SF' : m?.phase === 'cuartos' ? 'Cuartos' : m?.phase === 'octavos' ? 'Octavos' : '16vos'} ${matchNum}`;
    }
    if (res.homeGoals > res.awayGoals) return m.local;
    if (res.awayGoals > res.homeGoals) return m.visitante;
    if (res.teamPasses === "home") return m.local;
    if (res.teamPasses === "away") return m.visitante;
    return `Ganador ${matchId}`;
  }

  function getLoser(matchId: string): string {
    const res = resultados[matchId];
    const m = matchesMap[matchId];
    if (!res || res.status !== "finished" || res.homeGoals == null || res.awayGoals == null || !m) {
      const matchNum = matchId.split('_')[1] || matchId;
      return `Perdedor ${m?.phase === 'semis' ? 'SF' : m?.phase === 'cuartos' ? 'Cuartos' : m?.phase === 'octavos' ? 'Octavos' : '16vos'} ${matchNum}`;
    }
    if (res.homeGoals > res.awayGoals) return m.visitante;
    if (res.awayGoals > res.homeGoals) return m.local;
    if (res.teamPasses === "home") return m.visitante;
    if (res.teamPasses === "away") return m.local;
    return `Perdedor ${matchId}`;
  }

  // 4. Actualizar nombres de equipos en dieciseisavos (16vos)
  for (let i = 1; i <= 16; i++) {
    const matchId = `16v_${i}`;
    const m = matchesMap[matchId];
    const source = r32Sources[matchId];
    if (m && source) {
      m.local = source.local();
      m.visitante = source.visitante();
    }
  }

  // 5. Propagar Octavos (8v_1 a 8v_8)
  for (let i = 1; i <= 8; i++) {
    const m = matchesMap[`8v_${i}`];
    if (m) {
      m.local = getWinner(`16v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`16v_${(i-1)*2 + 2}`);
    }
  }

  // 6. Propagar Cuartos (4v_1 a 4v_4)
  for (let i = 1; i <= 4; i++) {
    const m = matchesMap[`4v_${i}`];
    if (m) {
      m.local = getWinner(`8v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`8v_${(i-1)*2 + 2}`);
    }
  }

  // 7. Propagar Semifinales (sf_1 y sf_2)
  for (let i = 1; i <= 2; i++) {
    const m = matchesMap[`sf_${i}`];
    if (m) {
      m.local = getWinner(`4v_${(i-1)*2 + 1}`);
      m.visitante = getWinner(`4v_${(i-1)*2 + 2}`);
    }
  }

  // 8. Propagar Gran Final y 3er Puesto
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

  // Retornar lista ordenada lógicamente
  return Object.values(matchesMap).sort((a: any, b: any) => {
    const phases = ["16vos", "octavos", "cuartos", "semis", "final"];
    const rA = phases.indexOf(a.phase);
    const rB = phases.indexOf(b.phase);
    if (rA !== rB) return rA - rB;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}
