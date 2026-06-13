import { getParticipants } from "../lib/data";
import { getDetailedPoints, MatchResult, PointsBreakdown } from "../lib/scoring";
import { getAllMatches } from "../lib/matches";

async function simulateKnockout() {
  const matches = await getAllMatches();
  const participants = await getParticipants();

  console.log("🏁 Simulando Puntos con Reglas de Eliminatoria 🏁\n");

  // Simulación: Diego puso México 2 - 1 Canadá (Pasa México)
  // Resultado Real: México 2 - 1 Canadá
  // Expectativa: Resultado Exacto (Normal) -> 3 pts

  // Simulación: Diego puso Brasil 1 - 0 Alemania (Pasa Brasil)
  // Resultado Real: Brasil 2 - 0 Alemania (Pasa Brasil)
  // Expectativa: Equipo que pasa (Suramericano) -> 3 pts

  const mockPredictionExact = { goles_local: 2, goles_visitante: 1, local: "México", visitante: "Canadá" };
  const mockResultExact: MatchResult = { homeGoals: 2, awayGoals: 1, status: 'finished', group: '16VOS' };
  
  const mockPredictionPass = { goles_local: 1, goles_visitante: 0, local: "Brasil", visitante: "Alemania" };
  const mockResultPass: MatchResult = { homeGoals: 2, awayGoals: 0, status: 'finished', group: '16VOS' };

  console.log("Prueba 1: Acierto Exacto (Normal - No Suramericano)");
  console.log("Predicción: MEX 2-1 CAN | Real: MEX 2-1 CAN");
  const res1 = getDetailedPoints(mockPredictionExact, mockResultExact);
  console.log(`Puntos obtenidos: ${res1.totalPoints} (Esperado: 3)\n`);

  console.log("Prueba 2: Acierto Quien Pasa (Suramericano)");
  console.log("Predicción: BRA 1-0 ALE (Pasa BRA) | Real: BRA 2-0 ALE (Pasa BRA)");
  const res2 = getDetailedPoints(mockPredictionPass, mockResultPass);
  console.log(`Puntos obtenidos: ${res2.totalPoints} (Esperado: 3)\n`);

  // Prueba Colombia
  const mockPredictionCol = { goles_local: 2, goles_visitante: 0, local: "Colombia", visitante: "España" };
  const mockResultColExact: MatchResult = { homeGoals: 2, awayGoals: 0, status: 'finished', group: 'OCTAVOS' };
  const mockResultColPass: MatchResult = { homeGoals: 1, awayGoals: 0, status: 'finished', group: 'OCTAVOS' };

  console.log("Prueba 3: Colombia Exacto");
  console.log("Predicción: COL 2-0 ESP | Real: COL 2-0 ESP");
  const res3 = getDetailedPoints(mockPredictionCol, mockResultColExact);
  console.log(`Puntos obtenidos: ${res3.totalPoints} (Esperado: 5)\n`);

  console.log("Prueba 4: Colombia Quien Pasa");
  console.log("Predicción: COL 2-0 ESP (Pasa COL) | Real: COL 1-0 ESP (Pasa COL)");
  const res4 = getDetailedPoints(mockPredictionCol, mockResultColPass);
  console.log(`Puntos obtenidos: ${res4.totalPoints} (Esperado: 3)\n`);
}

simulateKnockout();
