"use client";

import { useEffect, useState } from "react";
import { getResults, getKnockoutMatches } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getFlag } from "@/lib/flags";
import Link from "next/link";

export default function MatchesPage() {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [results, m, km] = await Promise.all([
        getResults(),
        getAllMatches(),
        getKnockoutMatches()
      ]);
      setData({ realResults: results });
      setMatches([...m, ...km]);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando Partidos...</div>;

  const realResults = data.realResults || {};

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase font-montserrat text-center">
          Calendario <span className="text-yellow-500">Mundialista</span>
        </h2>
        <div className="h-1 w-20 bg-red-600 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((match) => {
          const result = realResults[match.id];
          const isColombia = match.local === "Colombia" || match.visitante === "Colombia";

          return (
            <Link 
              key={match.id} 
              href={`/matches/${match.id}`}
              className={`block bg-white/5 border ${isColombia ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10'} rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden`}
            >
              {isColombia && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">
                  Premium 🇨🇴
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <img src={getFlag(match.local)} alt={match.local} className="w-12 h-12 object-cover rounded-full border-2 border-white/10 shadow-lg bg-black/40" />
                  <p className="font-bold text-[10px] text-center uppercase text-white tracking-tighter">{match.local}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-white">{result ? result.homeGoals : "-"}</span>
                    <span className="text-red-600 font-black text-xl">:</span>
                    <span className="text-3xl font-black text-white">{result ? result.awayGoals : "-"}</span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${result ? 'text-yellow-500 bg-yellow-500/10' : 'text-white/20'} px-3 py-1 rounded-full`}>
                    {result ? 'Finalizado' : match.time}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <img src={getFlag(match.visitante)} alt={match.visitante} className="w-12 h-12 object-cover rounded-full border-2 border-white/10 shadow-lg bg-black/40" />
                  <p className="font-bold text-[10px] text-center uppercase text-white tracking-tighter">{match.visitante}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
