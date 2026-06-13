import { syncUserPoints, ApiMatch } from "../lib/sync-engine";

async function simulateRealMatches() {
  // SIMULACIÓN: Estos son los dos partidos que ya ocurrieron
  const results: ApiMatch[] = [
    {
      id: "mex_saf",      // México vs Sur África
      homeGoals: 2, 
      awayGoals: 0, 
      status: 'finished'
    },
    {
      id: "sko_rch",      // Sur Korea vs Republica Checa
      homeGoals: 2, 
      awayGoals: 1, 
      status: 'finished'
    }
  ];

  console.log("🔄 Sincronizando puntos con resultados reales...");
  const resultsSync = await syncUserPoints(results);
  
  console.log("\n📊 Puntos actualizados:");
  resultsSync.forEach(r => {
    console.log(`${r.name.padEnd(20)}: ${r.points} pts`);
  });
}

simulateRealMatches();
