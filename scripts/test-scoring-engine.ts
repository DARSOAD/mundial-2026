import { getDetailedPoints, MatchResult, Prediction } from "../lib/scoring";

interface TestCase {
  name: string;
  pred: Prediction;
  res: MatchResult;
  expectedTotal: number;
}

const runTests = (phaseName: string, tests: TestCase[]) => {
  console.log(`\n==================================================`);
  console.log(`🏆 TESTS PARA: ${phaseName.toUpperCase()}`);
  console.log(`==================================================`);
  
  let passed = 0;
  tests.forEach((t, i) => {
    const result = getDetailedPoints(t.pred, t.res);
    const isPass = result.totalPoints === t.expectedTotal;
    if (isPass) passed++;
    
    console.log(`[${isPass ? '✅ PASS' : '❌ FAIL'}] ${t.name}`);
    console.log(`   Pred: ${t.pred.local} ${t.pred.goles_local}-${t.pred.goles_visitante} ${t.pred.visitante} | Real: ${t.res.homeGoals}-${t.res.awayGoals}`);
    if (!isPass) {
      console.log(`   --> ESPERADO: ${t.expectedTotal} | OBTENIDO: ${result.totalPoints}`);
      console.log(`   --> Desglose Obtenido:`, result);
    }
  });

  console.log(`\n=> RESULTADO: ${passed}/${tests.length} correctos en ${phaseName}\n`);
};

// -----------------------------------------------------------------------------
// CASOS DE PRUEBA: FASE DE GRUPOS
// Reglas: Exacto(3), Winner(1) | Suramérica: Exacto(4) | Colombia: Exacto(5)
// -----------------------------------------------------------------------------
const groupTests: TestCase[] = [
  // PARTIDOS NORMALES (NO SUDAMÉRICA)
  {
    name: "Regular - Acierto Exacto",
    pred: { local: "España", visitante: "Alemania", goles_local: 2, goles_visitante: 1 },
    res: { homeGoals: 2, awayGoals: 1, status: 'finished', group: 'A' },
    expectedTotal: 3
  },
  {
    name: "Regular - Acierto Ganador (sin goles exactos)",
    pred: { local: "España", visitante: "Alemania", goles_local: 1, goles_visitante: 0 },
    res: { homeGoals: 3, awayGoals: 0, status: 'finished', group: 'A' },
    expectedTotal: 1
  },
  {
    name: "Regular - Acierto Empate (sin goles exactos)",
    pred: { local: "España", visitante: "Alemania", goles_local: 1, goles_visitante: 1 },
    res: { homeGoals: 0, awayGoals: 0, status: 'finished', group: 'A' },
    expectedTotal: 1
  },
  {
    name: "Regular - Falla Total",
    pred: { local: "España", visitante: "Alemania", goles_local: 2, goles_visitante: 1 },
    res: { homeGoals: 0, awayGoals: 1, status: 'finished', group: 'A' },
    expectedTotal: 0
  },

  // PARTIDOS SURAMERICANOS (EXCLUYENDO COLOMBIA)
  {
    name: "Suramérica - Acierto Exacto",
    pred: { local: "Brasil", visitante: "Suiza", goles_local: 3, goles_visitante: 0 },
    res: { homeGoals: 3, awayGoals: 0, status: 'finished', group: 'B' },
    expectedTotal: 4
  },
  {
    name: "Suramérica - Acierto Ganador",
    pred: { local: "Brasil", visitante: "Suiza", goles_local: 1, goles_visitante: 0 },
    res: { homeGoals: 2, awayGoals: 0, status: 'finished', group: 'B' },
    expectedTotal: 1 // Solo el exacto tiene bono
  },

  // PARTIDOS DE COLOMBIA
  {
    name: "Colombia - Acierto Exacto",
    pred: { local: "Colombia", visitante: "Japón", goles_local: 2, goles_visitante: 0 },
    res: { homeGoals: 2, awayGoals: 0, status: 'finished', group: 'C' },
    expectedTotal: 5
  },
  {
    name: "Colombia - Acierto Ganador",
    pred: { local: "Colombia", visitante: "Japón", goles_local: 1, goles_visitante: 0 },
    res: { homeGoals: 3, awayGoals: 1, status: 'finished', group: 'C' },
    expectedTotal: 1 // Solo el exacto tiene bono
  },
];


// -----------------------------------------------------------------------------
// CASOS DE PRUEBA: ELIMINATORIAS (KNOCKOUT)
// Reglas: Exacto(3), Pasa(2) | Suramérica: Exacto(4), Pasa(3) | Colombia: Exacto(5), Pasa(3)
// -----------------------------------------------------------------------------
const knockoutTests: TestCase[] = [
  // PARTIDOS NORMALES
  {
    name: "Regular KO - Acierto Exacto",
    pred: { local: "Inglaterra", visitante: "Francia", goles_local: 1, goles_visitante: 1 }, // Pronóstico asume que no acierta quién pasa en penales si no hay UI
    res: { homeGoals: 1, awayGoals: 1, status: 'finished', group: 'OCTAVOS' },
    expectedTotal: 3
  },
  {
    name: "Regular KO - Acierto Quien Pasa (Gana en 90m)",
    pred: { local: "Inglaterra", visitante: "Francia", goles_local: 2, goles_visitante: 0 },
    res: { homeGoals: 3, awayGoals: 1, status: 'finished', group: 'OCTAVOS' },
    expectedTotal: 2
  },
  {
    name: "Regular KO - Acierto Quien Pasa (Realidad fue empate, pero mi equipo ganó en penales)",
    pred: { local: "Inglaterra", visitante: "Francia", goles_local: 1, goles_visitante: 0 }, // Yo dije que Inglaterra ganaba
    res: { homeGoals: 0, awayGoals: 0, status: 'finished', group: 'OCTAVOS', teamPasses: 'home' }, // Quedaron 0-0 pero Inglaterra pasó
    expectedTotal: 2 // Acierto que pasó el local
  },
  {
    name: "Regular KO - Falla Quien Pasa (Yo puse empate)",
    pred: { local: "Inglaterra", visitante: "Francia", goles_local: 0, goles_visitante: 0 }, // Yo puse 0-0
    res: { homeGoals: 2, awayGoals: 1, status: 'finished', group: 'OCTAVOS' }, // Ganó Inglaterra 2-1
    expectedTotal: 0 // Si puse empate y no le atiné a los goles, fallo el "Pasa" porque mi predicción no declara un ganador
  },

  // PARTIDOS SURAMERICANOS
  {
    name: "Suramérica KO - Acierto Exacto",
    pred: { local: "Argentina", visitante: "Alemania", goles_local: 2, goles_visitante: 1 },
    res: { homeGoals: 2, awayGoals: 1, status: 'finished', group: 'CUARTOS' },
    expectedTotal: 4
  },
  {
    name: "Suramérica KO - Acierto Quien Pasa",
    pred: { local: "Argentina", visitante: "Alemania", goles_local: 1, goles_visitante: 0 },
    res: { homeGoals: 3, awayGoals: 0, status: 'finished', group: 'CUARTOS' },
    expectedTotal: 3
  },

  // PARTIDOS COLOMBIA
  {
    name: "Colombia KO - Acierto Exacto",
    pred: { local: "Colombia", visitante: "Brasil", goles_local: 1, goles_visitante: 2 },
    res: { homeGoals: 1, awayGoals: 2, status: 'finished', group: 'SEMIS' },
    expectedTotal: 5
  },
  {
    name: "Colombia KO - Acierto Quien Pasa",
    pred: { local: "Colombia", visitante: "Brasil", goles_local: 2, goles_visitante: 0 },
    res: { homeGoals: 1, awayGoals: 0, status: 'finished', group: 'SEMIS' },
    expectedTotal: 3
  },
  {
    name: "Colombia KO - Falla (Aposté a Colombia y perdió)",
    pred: { local: "Colombia", visitante: "Brasil", goles_local: 2, goles_visitante: 0 },
    res: { homeGoals: 0, awayGoals: 3, status: 'finished', group: 'SEMIS' },
    expectedTotal: 0
  },
];

runTests("Fase de Grupos", groupTests);
runTests("Eliminatorias", knockoutTests);
