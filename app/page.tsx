import { getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getFlag } from "@/lib/flags";
import { getDetailedPoints, MatchResult } from "@/lib/scoring";
import Link from "next/link";

export default async function HomePage() {
  const [participants, matches] = await Promise.all([
    getParticipants(),
    getAllMatches()
  ]);

  // Resultados de ejemplo (Simulación)
  const realResults: Record<string, MatchResult> = {
    "mex_saf": { homeGoals: 2, awayGoals: 0, status: 'finished' },
    "sko_rch": { homeGoals: 2, awayGoals: 1, status: 'finished' }
  };

  const processedParticipants = participants.map(p => {
    const breakdown = {
      exactColombia: 0,
      exactSouthAmerica: 0,
      exactRegular: 0,
      winnerResult: 0,
      totalPoints: 0
    };

    Object.keys(realResults).forEach(matchId => {
      const pred = p.predictions[matchId];
      if (pred) {
        const points = getDetailedPoints(pred, realResults[matchId]);
        breakdown.exactColombia += points.exactColombia || 0;
        breakdown.exactSouthAmerica += points.exactSouthAmerica || 0;
        breakdown.exactRegular += points.exactRegular || 0;
        breakdown.winnerResult += points.winnerResult || 0;
        breakdown.totalPoints += points.totalPoints || 0;
      }
    });

    return { ...p, breakdown };
  });

  const sortedParticipants = [...processedParticipants].sort((a, b) => b.breakdown.totalPoints - a.breakdown.totalPoints);
  
  // El próximo partido será el primero que no esté en realResults
  const nextMatch = matches.find(m => !realResults[m.id]) || matches[0];

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: LEADERBOARD */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 border border-yellow-500/20 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-600/20 to-transparent px-8 py-6 border-b border-white/5">
              <h2 className="text-2xl font-black font-montserrat flex items-center gap-3 italic tracking-tight uppercase">
                <span className="text-yellow-500">🏆</span> Ranking <span className="text-white">Familiar</span>
              </h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {sortedParticipants.map((p, index) => (
                <div key={p.userId} className={`px-8 py-6 transition-all ${index === 0 ? 'bg-yellow-500/5' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black font-montserrat w-8 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-white/20'}`}>
                        {index + 1}
                      </span>
                      <p className="font-black text-xl tracking-tight">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-black font-montserrat ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>
                        {p.breakdown.totalPoints}
                      </span>
                      <span className="text-[10px] ml-1 font-black text-white/40 uppercase">pts</span>
                    </div>
                  </div>

                  {/* DESGLOSE DE ACIERTOS COMPACTO */}
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-yellow-500 text-xs font-black">{p.breakdown.exactColombia}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🇨🇴</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-blue-500 text-xs font-black">{p.breakdown.exactSouthAmerica}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🌎</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-white text-xs font-black">{p.breakdown.exactRegular}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🎯</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-white/60 text-xs font-black">{p.breakdown.winnerResult}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Link href="/calendar" className="bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-center uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20">
            Ver Calendario Completo y Predicciones
          </Link>
        </div>

        {/* COLUMNA DERECHA: PARTIDOS (7 de 12 columnas) */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col gap-8">
          
          {/* PARTIDO DESTACADO */}
          {nextMatch && (
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-[3rem] p-1 shadow-2xl shadow-yellow-500/10">
              <div className="bg-[#0f1115] rounded-[2.9rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl grayscale">⚽</div>
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className="bg-black/40 px-4 py-1 rounded-full border border-yellow-500/30">
                      <p className="text-center text-yellow-500 font-black uppercase tracking-[0.2em] text-[10px]">{nextMatch.date} • {nextMatch.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col items-center gap-4">
                      <span className="text-6xl">{getFlag(nextMatch.local)}</span>
                      <p className="font-black text-xl uppercase font-montserrat text-center leading-none">{nextMatch.local}</p>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl font-black text-2xl italic">
                        VS
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-4">
                      <span className="text-6xl">{getFlag(nextMatch.visitante)}</span>
                      <p className="font-black text-xl uppercase font-montserrat text-center leading-none">{nextMatch.visitante}</p>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-center">
                    <Link href={`/matches/${nextMatch.id}`} className="bg-white text-black font-black px-8 py-3 rounded-full uppercase tracking-tighter text-sm hover:scale-105 transition-transform">
                      Ver predicciones de la familia
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTROS PARTIDOS PRÓXIMOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.filter(m => m.id !== nextMatch.id).slice(0, 4).map(m => (
              <Link key={m.id} href={`/matches/${m.id}`} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFlag(m.local)}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] uppercase text-white/60 leading-none">{m.local}</span>
                    <span className="text-[8px] text-white/20 mt-1">{m.date}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-yellow-500 group-hover:scale-110 transition-transform">VS</span>
                  <span className="text-[8px] text-white/30">{m.time}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-[10px] uppercase text-white/60 leading-none">{m.visitante}</span>
                  </div>
                  <span className="text-2xl">{getFlag(m.visitante)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
