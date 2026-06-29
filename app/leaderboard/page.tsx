"use client";

import { useEffect, useState } from "react";
import { getResults, getParticipants, getKnockoutMatches } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getDetailedPoints, MatchResult } from "@/lib/scoring";

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [results, participants, m, km] = await Promise.all([
        getResults(),
        getParticipants(),
        getAllMatches(),
        getKnockoutMatches()
      ]);
      
      const mappedKnockouts = km.map((m: any) => ({
        id: m.id,
        local: m.local || "Por Definir",
        visitante: m.visitante || "Por Definir",
        date: m.date,
        time: m.time,
        group: m.group || m.phase.toUpperCase(),
        order: 1000 + parseInt(m.id.split('_')[1] || '0', 10),
        homeIsPredLocal: true,
        calendarHome: m.local,
        calendarAway: m.visitante
      }));

      setData({ participants, realResults: results });
      setMatches([...m, ...mappedKnockouts]);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando Ranking...</div>;

  const participants = data.participants || [];
  const realResults = data.realResults || {};

  const processedParticipants = participants.map((p: any) => {
    const breakdown = {
      exactColombia: 0, exactSouthAmerica: 0, exactRegular: 0, winnerResult: 0, totalPoints: 0
    };

    Object.keys(realResults).forEach(matchId => {
      const pred = p.predictions[matchId];
      if (pred) {
        const matchData = matches.find(m => m.id === matchId);
        const resultWithGroup = { ...realResults[matchId], group: matchData?.group };
        const points = getDetailedPoints(pred, resultWithGroup);
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

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black font-montserrat italic uppercase tracking-tighter text-white">
          Ranking <span className="text-yellow-500">Oficial</span>
        </h2>
        <div className="h-1.5 w-32 bg-red-600 mx-auto mt-4 rounded-full" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="divide-y divide-white/5">
          {sortedParticipants.map((p: any, index: number) => (
            <div key={p.userId} className={`flex items-center justify-between px-10 py-6 transition-all ${index === 0 ? 'bg-yellow-500/10' : ''}`}>
              <div className="flex items-center gap-6">
                <span className={`text-3xl font-black font-montserrat w-10 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-white/20'}`}>
                  #{index + 1}
                </span>
                <div>
                  <p className="text-2xl font-black tracking-tight text-white">{p.name}</p>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-white/5 rounded-md px-2 py-0.5 border border-white/5">
                      <span className="text-yellow-500 text-[10px] font-black">{p.breakdown.exactColombia}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🇨🇴</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-md px-2 py-0.5 border border-white/5">
                      <span className="text-blue-500 text-[10px] font-black">{p.breakdown.exactSouthAmerica}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🌎</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-md px-2 py-0.5 border border-white/5">
                      <span className="text-white text-[10px] font-black">{p.breakdown.exactRegular}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">🎯</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-md px-2 py-0.5 border border-white/5">
                      <span className="text-white/60 text-[10px] font-black">{p.breakdown.winnerResult}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">✓</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className={`text-5xl font-black font-montserrat ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>
                    {p.breakdown.totalPoints}
                  </span>
                  <span className="text-xs font-black text-white/40 uppercase tracking-tighter italic">pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
