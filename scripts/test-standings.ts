import fs from "fs";
import path from "path";
import { getStandingsAndQualified, computeKnockoutBracket } from "../lib/bracket-utils";

async function main() {
  const calendario = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/calendario.json"), "utf8"));
  const resultados = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/resultados.json"), "utf8"));
  
  console.log("=== CALCULANDO POSICIONES ===");
  const { standings, bestThirds } = getStandingsAndQualified(calendario, resultados);

  console.log("\n=== STANDINGS GRUPO A ===");
  console.log(standings["A"]);

  console.log("\n=== MEJORES TERCEROS ===");
  console.log(bestThirds);

  console.log("\n=== GENERANDO BRACKET ===");
  const bracket = computeKnockoutBracket(calendario, resultados, []);
  console.log(`Bracket generado con ${bracket.length} partidos de eliminatoria.`);
  console.log("\nPrimeros 4 partidos de 16vos:");
  console.log(bracket.slice(0, 4));
}

main().catch(console.error);
