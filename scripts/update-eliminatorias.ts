// scripts/update-eliminatorias.ts
import fs from "fs";
import path from "path";
import { computeKnockoutBracket } from "../lib/bracket-utils";

function update() {
  const calendarioPath = path.join(__dirname, "../public/calendario.json");
  const resultadosPath = path.join(__dirname, "../public/resultados.json");
  const eliminatoriasPath = path.join(__dirname, "../public/eliminatorias.json");

  const calendario = JSON.parse(fs.readFileSync(calendarioPath, "utf8"));
  const resultados = JSON.parse(fs.readFileSync(resultadosPath, "utf8"));
  
  // Read existing matches if available to preserve metadata (like date/time)
  let existing: any[] = [];
  if (fs.existsSync(eliminatoriasPath)) {
    existing = JSON.parse(fs.readFileSync(eliminatoriasPath, "utf8"));
  }

  const updatedBracket = computeKnockoutBracket(calendario, resultados, existing);
  
  fs.writeFileSync(eliminatoriasPath, JSON.stringify(updatedBracket, null, 2), "utf8");
  console.log("Successfully updated public/eliminatorias.json with correct matches!");
}

update();
