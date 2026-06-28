"use client";

import { useEffect, useState } from "react";
import { getResults, getParticipants, getKnockoutMatches } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getFlag } from "@/lib/flags";
import { notFound } from "next/navigation";

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [results, participants, m, km] = await Promise.all([
          getResults(),
          getParticipants(),
          getAllMatches(),
          getKnockoutMatches()
        ]);
        setData({ participants, realResults: results });
        setMatches([...m, ...km]);
      } catch (error) {
        console.error("Error loading match detail data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest">Cargando Detalle...</div>;

  const match = matches.find(m => m.id === matchId);
  if (!match) return notFound();

  const realResults = data.realResults || {};
  const result = realResults[matchId];
  const participants = data.participants || [];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-gradient-to-b from-white/10 to-transparent p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/5 mb-12 text-center shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-6">
          <div className="md:text-right flex-1 w-full flex flex-col items-center md:items-end">
            <img src={getFlag(match.local)} alt={match.local} className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-full border-4 border-white/10 mb-4 shadow-2xl bg-black/40" />
            <p className="text-2xl md:text-4xl font-black font-montserrat uppercase text-white tracking-tight">{match.local}</p>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
            <div className="bg-yellow-500 text-black font-black text-3xl md:text-5xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-2xl rotate-3 shadow-2xl shadow-yellow-500/20">
              {result ? result.homeGoals : "-"}
            </div>
            <span className="text-white/20 font-black tracking-widest text-lg">VS</span>
            <div className="bg-white text-black font-black text-3xl md:text-5xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-2xl -rotate-3 shadow-2xl">
              {result ? result.awayGoals : "-"}
            </div>
          </div>
          <div className="md:text-left flex-1 w-full flex flex-col items-center md:items-start">
            <img src={getFlag(match.visitante)} alt={match.visitante} className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-full border-4 border-white/10 mb-4 shadow-2xl bg-black/40" />
            <p className="text-2xl md:text-4xl font-black font-montserrat uppercase text-white tracking-tight">{match.visitante}</p>
          </div>
        </div>
        {result && (
          <p className="text-red-500 font-black uppercase tracking-[0.4em] text-[10px] mt-8">Resultado Final Confirmado</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((p: any) => {
          const pred = p.predictions[matchId];
          const isExact = result && pred && pred.goles_local === result.homeGoals && pred.goles_visitante === result.awayGoals;
          
          return (
            <div key={p.userId} className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 ${isExact ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)] scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base shadow-inner ${isExact ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40'}`}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-lg">{p.name}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Predicción</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-black font-montserrat ${isExact ? 'text-yellow-500' : 'text-slate-100'}`}>
                  {pred?.goles_local ?? '-'} <span className="text-white/10">:</span> {pred?.goles_visitante ?? '-'}
                </div>
                {isExact && <span className="text-[8px] font-black text-yellow-500 bg-yellow-500/20 px-3 py-1 rounded-full uppercase tracking-widest mt-1 inline-block">¡Acierto! 🎯</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
