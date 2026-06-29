// Equipos Sudamericanos para los bonos
const SOUTH_AMERICAN_TEAMS = [
  "Argentina", "Brasil", "Uruguay", "Colombia", "Ecuador", 
  "Paraguay", "Chile", "Perú", "Venezuela", "Bolivia"
];

// Identificadores de fases de eliminación directa
const KNOCKOUT_GROUPS = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"];

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
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
  if (result.status === 'scheduled' || prediction.goles_local === null || prediction.goles_visitante === null) {
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
      if (isColombia) return { winnerResult: 1, totalPoints: 3 };
      if (isSouthAmerica) return { winnerResult: 1, totalPoints: 3 };
      return { winnerResult: 1, totalPoints: 2 };
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
