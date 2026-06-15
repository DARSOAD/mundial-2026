"use client";

import { useEffect, useState } from "react";
import { getAllMatches } from "@/lib/matches";
import { getFlag } from "@/lib/flags";
import { getDetailedPoints, MatchResult } from "@/lib/scoring";
import { getResults, getParticipants } from "@/lib/data";
import Link from "next/link";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [results, participants, m] = await Promise.all([
        getResults(),
        getParticipants(),
        getAllMatches()
      ]);
      setData({ participants, realResults: results });
      setMatches(m);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse text-center p-4">Cargando Mundial 2026...</div>;

  const participants = data.participants || [];
  const realResults = data.realResults || {}; // ¡AHORA LEEMOS DEL SNAPSHOT REAL!

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
  
  // El próximo partido es el primero que NO tiene resultados en el snapshot
  const nextMatch = matches.find(m => !realResults[m.id]) || matches[0];

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: RANKING */}
        <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 border border-yellow-500/20 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-600/20 to-transparent px-8 py-6 border-b border-white/5">
              <h2 className="text-2xl font-black font-montserrat flex items-center gap-3 italic tracking-tight uppercase text-white">
                <span className="text-yellow-500">🏆</span> Ranking <span className="text-white">Familiar</span>
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {sortedParticipants.length > 0 ? sortedParticipants.map((p: any, index) => (
                <div key={p.userId} className={`px-8 py-6 transition-all ${index === 0 ? 'bg-yellow-500/5' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black font-montserrat w-8 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-white/20'}`}>
                        #{index + 1}
                      </span>
                      <p className="font-black text-xl tracking-tight text-white">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-black font-montserrat ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>{p.breakdown.totalPoints}</span>
                      <span className="text-[10px] ml-1 font-black text-white/40 uppercase">pts</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              )) : <p className="p-8 text-center text-white/20 font-bold uppercase tracking-widest text-xs">Esperando migración de datos...</p>}
            </div>
          </div>
          <Link href="/calendar" className="bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-center uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20">Ver Calendario Completo</Link>
        </div>

        {/* COLUMNA DERECHA: PARTIDOS */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col gap-8">
          {nextMatch && (
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-[3rem] p-1 shadow-2xl shadow-yellow-500/10">
              <div className="bg-[#0f1115] rounded-[2.9rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl grayscale text-white">⚽</div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className="bg-black/40 px-4 py-1 rounded-full border border-yellow-500/30">
                      <p className="text-center text-yellow-500 font-black uppercase tracking-[0.2em] text-[10px]">{nextMatch.date} • {nextMatch.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col items-center gap-4">
                      <img src={getFlag(nextMatch.local)} alt={nextMatch.local} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full border-4 border-yellow-500/50 shadow-2xl bg-black/40" />
                      <p className="font-black text-xl uppercase font-montserrat text-center leading-none text-white">{nextMatch.local}</p>
                    </div>
                    <div className="flex flex-col items-center"><div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl font-black text-2xl italic text-white text-center">VS<span className="block text-[8px] not-italic text-white/30">{nextMatch.group}</span></div></div>
                    <div className="flex-1 flex flex-col items-center gap-4">
                      <img src={getFlag(nextMatch.visitante)} alt={nextMatch.visitante} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full border-4 border-white/10 shadow-2xl bg-black/40" />
                      <p className="font-black text-xl uppercase font-montserrat text-center leading-none text-white">{nextMatch.visitante}</p>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-center">
                    <Link href={`/matches/${nextMatch.id}`} className="bg-white text-black font-black px-8 py-3 rounded-full uppercase tracking-tighter text-sm hover:scale-105 transition-transform">Ver predicciones</Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.filter(m => !realResults[m.id] && m.id !== nextMatch?.id).slice(0, 4).map(m => (
              <Link key={m.id} href={`/matches/${m.id}`} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <img src={getFlag(m.local)} className="w-10 h-10 object-cover rounded-full border border-white/10" />
                  <div className="flex flex-col"><span className="font-bold text-[10px] uppercase text-white/60 leading-none">{m.local}</span><span className="text-[8px] text-white/20 mt-1">{m.date}</span></div>
                </div>
                <div className="flex flex-col items-center"><span className="text-[10px] font-black text-yellow-500 uppercase">{m.time}</span></div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col items-end"><span className="font-bold text-[10px] uppercase text-white/60 leading-none">{m.visitante}</span><span className="text-[8px] text-white/20 mt-1">GRUPO {m.group}</span></div>
                  <img src={getFlag(m.visitante)} className="w-10 h-10 object-cover rounded-full border border-white/10" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
