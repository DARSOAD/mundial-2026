import fs from "fs";
import path from "path";
import { getStandingsAndQualified, computeKnockoutBracket, assignThirdsWithFallback } from "../lib/bracket-utils";

async function verify() {
  const calendario = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/calendario.json"), "utf8"));
  const resultados = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/resultados.json"), "utf8"));

  const { standings, qualified1st, qualified2nd, bestThirds } = getStandingsAndQualified(calendario, resultados);

  console.log("=== 1. VERIFICACIÓN DE CLASIFICADOS ===");
  console.log("Líderes de Grupo (1°):");
  Object.entries(qualified1st).forEach(([g, t]) => console.log(`  Grupo ${g}: ${t.name}`));
  
  console.log("\nSegundos de Grupo (2°):");
  Object.entries(qualified2nd).forEach(([g, t]) => console.log(`  Grupo ${g}: ${t.name}`));

  console.log("\nMejores Terceros Clasificados (8):");
  bestThirds.forEach((t, i) => console.log(`  #${i+1} Grupo ${t.group}: ${t.name} (${t.pts} pts, DG: ${t.dg}, GF: ${t.gf})`));

  console.log("\n=== 2. VERIFICACIÓN DE EMPAREJAMIENTOS DE TERCEROS ===");
  const thirdsAssignments = assignThirdsWithFallback(bestThirds);
  thirdsAssignments.forEach(a => {
    console.log(`  Slot ${a.slotName} (${a.slotId}) vs 3° Grupo ${a.team.group} (${a.team.name})`);
  });

  console.log("\n=== 3. VERIFICACIÓN DE TODOS LOS PARTIDOS DE 16VOS ===");
  const bracket = computeKnockoutBracket(calendario, resultados, []);
  const r32Matches = bracket.filter(m => m.phase === "16vos");

  let errors = 0;
  r32Matches.forEach(m => {
    // Buscar los grupos de los equipos
    const teamLocal = m.local;
    const teamAway = m.visitante;

    const findGroup = (team: string) => {
      for (const g in standings) {
        if (standings[g].some(t => t.name === team)) return g;
      }
      return "?";
    };

    const groupLocal = findGroup(teamLocal);
    const groupAway = findGroup(teamAway);

    console.log(`  ${m.id}: ${teamLocal} (Grp ${groupLocal}) vs ${teamAway} (Grp ${groupAway})`);

    if (groupLocal === groupAway && groupLocal !== "?") {
      console.error(`  ❌ ERROR: ¡Remancha detectada en ${m.id}! Ambos equipos son del Grupo ${groupLocal}`);
      errors++;
    }
  });

  if (errors === 0) {
    console.log("\n✅ ¡Éxito! Ningún equipo se enfrenta a un rival de su mismo grupo en los 16vos de final.");
  } else {
    console.error(`\n❌ ¡Se encontraron ${errors} errores de restricción de grupo!`);
  }
}

verify().catch(console.error);
