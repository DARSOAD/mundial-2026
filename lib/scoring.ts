// Equipos Sudamericanos para los bonos
const SOUTH_AMERICAN_TEAMS = [
  "Argentina", "Brasil", "Uruguay", "Colombia", "Ecuador", 
  "Paraguay", "Chile", "Perú", "Venezuela", "Bolivia"
];

// Identificadores de fases de eliminación directa
const KNOCKOUT_GROUPS = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"];

export interface MatchResult {
  homeGoals: number | null;
  awayGoals: number | null;
  status: 'live' | 'finished' | 'scheduled';
  group?: string; // Para saber si es fase de grupos o eliminatoria
  teamPasses?: 'home' | 'away' | null; // Quien pasa en caso de penales en eliminatorias
  local?: string;
  visitante?: string;
}

export interface Prediction {
  goles_local: number | null;
  goles_visitante: number | null;
  local?: string;
  visitante?: string;
  team_passes?: 'home' | 'away' | null;
}

export interface PointsBreakdown {
  exactColombia: number;
  exactSouthAmerica: number;
  exactRegular: number;
  winnerResult: number; // Acierto de Ganador/Empate en Grupos O Acierto de "Quien Pasa" en Eliminatorias
  totalPoints: number;
}

export function getDetailedPoints(prediction: Prediction, result: MatchResult): Partial<PointsBreakdown> {
  if (
    result.status === 'scheduled' ||
    prediction.goles_local === null ||
    prediction.goles_visitante === null ||
    result.homeGoals === null ||
    result.awayGoals === null ||
    result.homeGoals === undefined ||
    result.awayGoals === undefined
  ) {
    return { totalPoints: 0 };
  }

  const { goles_local: pLocal, goles_visitante: pVisitante, local, visitante } = prediction;
  const { homeGoals: rLocal, awayGoals: rVisitante, group, teamPasses } = result;

  const localName = local || result.local || "";
  const visitanteName = visitante || result.visitante || "";

  const isKnockout = group ? KNOCKOUT_GROUPS.includes(group) : false;
  const isColombia = localName === "Colombia" || visitanteName === "Colombia";
  const isSouthAmerica = SOUTH_AMERICAN_TEAMS.includes(localName) || SOUTH_AMERICAN_TEAMS.includes(visitanteName);

  // 1. RESULTADO EXACTO (Mismos goles)
  // Las reglas de Exacto son las mismas para Grupos y Eliminatorias en cuanto a puntaje:
  // Colombia (5), Sudamérica (4), Normal (3)
  if (pLocal === rLocal && pVisitante === rVisitante) {
    if (isColombia) return { exactColombia: 1, totalPoints: 5 };
    if (isSouthAmerica) return { exactSouthAmerica: 1, totalPoints: 4 };
    return { exactRegular: 1, totalPoints: 3 };
  }

  // 2. ACIERTO DE RESULTADO / QUIÉN PASA
  if (isKnockout) {
    // REGLA ELIMINATORIAS: Acertar quién pasa
    // En eliminatorias no hay empates al final, alguien tiene que pasar (penales/prórroga)
    // El pronóstico asume que quien puso más goles, pasa. (Si pone empate, pierde este punto a menos que hagamos UI para elegir quien pasa en penales, por ahora asumimos que el ganador del pronóstico es el que pasa).
    let predictionPasses = pLocal > pVisitante ? 'home' : (pLocal < pVisitante ? 'away' : (prediction.team_passes || null));
    
    // Si la predicción es empate, no podemos saber quién cree que pasa en penales
    // a menos que en la UI haya un selector. Por ahora, si predicen empate y no aciertan los goles, sacan 0.
    
    // El resultado real de quién pasa se define por los goles o por el campo `teamPasses` (si hubo penales)
    let actualPasses = teamPasses;
    if (!actualPasses) {
      actualPasses = rLocal > rVisitante ? 'home' : (rLocal < rVisitante ? 'away' : null);
    }

    if (predictionPasses && predictionPasses === actualPasses) {
      return { winnerResult: 1, totalPoints: 1 };
    }
  } else {
    // REGLA FASE DE GRUPOS: Acertar Ganador o Empate
    const predictionWinner = pLocal > pVisitante ? 'home' : (pLocal < pVisitante ? 'away' : 'draw');
    const realWinner = rLocal > rVisitante ? 'home' : (rLocal < rVisitante ? 'away' : 'draw');

    if (predictionWinner === realWinner) {
      return { winnerResult: 1, totalPoints: 1 };
    }
  }

  return { totalPoints: 0 };
}

export function calculateMatchPoints(prediction: Prediction, result: MatchResult): number {
  return getDetailedPoints(prediction, result).totalPoints || 0;
}

export interface Podium {
  campeon: string | null;
  subcampeon: string | null;
  tercer_lugar: string | null;
  cuarto_lugar: string | null;
}

export interface FinalsPointsBreakdown {
  campeon: number;
  subcampeon: number;
  tercer_lugar: number;
  cuarto_lugar: number;
  totalPoints: number;
}

export function getActualPodium(matches: any[], realResults: Record<string, any>): Podium {
  const fin1Match = matches.find(m => m.id === "fin_1");
  const fin2Match = matches.find(m => m.id === "fin_2");

  const podium: Podium = {
    campeon: null,
    subcampeon: null,
    tercer_lugar: null,
    cuarto_lugar: null
  };

  if (fin1Match) {
    const res1 = realResults["fin_1"];
    const hasRes1 = res1 && res1.homeGoals != null && res1.awayGoals != null;
    if (hasRes1 && fin1Match.local && fin1Match.visitante) {
      if (res1.homeGoals > res1.awayGoals) {
        podium.campeon = fin1Match.local;
        podium.subcampeon = fin1Match.visitante;
      } else if (res1.awayGoals > res1.homeGoals) {
        podium.campeon = fin1Match.visitante;
        podium.subcampeon = fin1Match.local;
      } else if (res1.teamPasses === "home") {
        podium.campeon = fin1Match.local;
        podium.subcampeon = fin1Match.visitante;
      } else if (res1.teamPasses === "away") {
        podium.campeon = fin1Match.visitante;
        podium.subcampeon = fin1Match.local;
      }
    }
  }

  if (fin2Match) {
    const res2 = realResults["fin_2"];
    const hasRes2 = res2 && res2.homeGoals != null && res2.awayGoals != null;
    if (hasRes2 && fin2Match.local && fin2Match.visitante) {
      if (res2.homeGoals > res2.awayGoals) {
        podium.tercer_lugar = fin2Match.local;
        podium.cuarto_lugar = fin2Match.visitante;
      } else if (res2.awayGoals > res2.homeGoals) {
        podium.tercer_lugar = fin2Match.visitante;
        podium.cuarto_lugar = fin2Match.local;
      } else if (res2.teamPasses === "home") {
        podium.tercer_lugar = fin2Match.local;
        podium.cuarto_lugar = fin2Match.visitante;
      } else if (res2.teamPasses === "away") {
        podium.tercer_lugar = fin2Match.visitante;
        podium.cuarto_lugar = fin2Match.local;
      }
    }
  }

  return podium;
}

export function getFinalsPoints(userFinals: Record<string, string>, actualPodium: Podium): FinalsPointsBreakdown {
  const breakdown = {
    campeon: 0,
    subcampeon: 0,
    tercer_lugar: 0,
    cuarto_lugar: 0,
    totalPoints: 0
  };

  const normalize = (name: string | null | undefined) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const ptsConfig = {
    campeon: 9,
    subcampeon: 6,
    tercer_lugar: 3,
    cuarto_lugar: 0
  };

  if (actualPodium.campeon && userFinals.campeon) {
    if (normalize(userFinals.campeon) === normalize(actualPodium.campeon)) {
      breakdown.campeon = ptsConfig.campeon;
      breakdown.totalPoints += ptsConfig.campeon;
    }
  }

  if (actualPodium.subcampeon && userFinals.subcampeon) {
    if (normalize(userFinals.subcampeon) === normalize(actualPodium.subcampeon)) {
      breakdown.subcampeon = ptsConfig.subcampeon;
      breakdown.totalPoints += ptsConfig.subcampeon;
    }
  }

  if (actualPodium.tercer_lugar && userFinals.tercer_lugar) {
    if (normalize(userFinals.tercer_lugar) === normalize(actualPodium.tercer_lugar)) {
      breakdown.tercer_lugar = ptsConfig.tercer_lugar;
      breakdown.totalPoints += ptsConfig.tercer_lugar;
    }
  }

  if (actualPodium.cuarto_lugar && userFinals.cuarto_lugar) {
    if (normalize(userFinals.cuarto_lugar) === normalize(actualPodium.cuarto_lugar)) {
      breakdown.cuarto_lugar = ptsConfig.cuarto_lugar;
      breakdown.totalPoints += ptsConfig.cuarto_lugar;
    }
  }

  return breakdown;
}
