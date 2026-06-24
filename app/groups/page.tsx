"use client";

import { useEffect, useState } from "react";
import { getResults } from "@/lib/data";
import { getStandingsAndQualified, TeamStats } from "@/lib/bracket-utils";
import { getFlag } from "@/lib/flags";
import Link from "next/link";

export default function GroupsPage() {
  const [standings, setStandings] = useState<Record<string, TeamStats[]>>({});
  const [bestThirds, setBestThirds] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [calendario, resultados] = await Promise.all([
          fetch("/mundial-2026/calendario.json?t=" + Date.now()).then(res => res.json()),
          getResults()
        ]);

        const computed = getStandingsAndQualified(calendario, resultados);
        setStandings(computed.standings);
        setBestThirds(computed.bestThirds);
      } catch (error) {
        console.error("Error loading group standings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">
        Calculando Tablas de Posiciones...
      </div>
    );
  }

  const groupKeys = Object.keys(standings).sort();
  const isBestThird = (teamName: string) => bestThirds.some(t => t.name === teamName);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* HEADER SECTION */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase font-montserrat">
          Fase de <span className="text-yellow-500">Grupos</span>
        </h2>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
          Mundial 2026 • Tablas de Posiciones Oficiales
        </p>
      </div>

      {/* CLASSIFICATION RULE CARD */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">💡</span>
          <div>
            <h3 className="text-sm font-black text-white uppercase">Regla de Clasificación Mundial 2026</h3>
            <p className="text-xs text-white/50 mt-1 max-w-xl">
              Clasifican a 16vos de final los <span className="text-yellow-500 font-bold">1° y 2° puestos</span> de cada uno de los 12 grupos, más los <span className="text-yellow-500 font-bold">8 mejores 3° puestos</span> en total.
            </p>
          </div>
        </div>
        <Link href="/bracket" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all whitespace-nowrap shadow-lg shadow-yellow-500/10">
          Ver Bracket 🏆
        </Link>
      </div>

      {/* GROUPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groupKeys.map(groupName => {
          const teams = standings[groupName] || [];

          return (
            <div key={groupName} className="bg-[#16191f] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-yellow-500/20">
              {/* Group Title Header */}
              <div className="bg-gradient-to-r from-yellow-600/10 to-transparent px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-black font-montserrat text-white uppercase">
                  Grupo <span className="text-yellow-500">{groupName}</span>
                </h3>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Standing</span>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-white/40 uppercase tracking-wider bg-black/20">
                      <th className="py-3 px-4 text-center w-8">#</th>
                      <th className="py-3 px-2">Equipo</th>
                      <th className="py-3 px-2 text-center">PTS</th>
                      <th className="py-3 px-2 text-center">PJ</th>
                      <th className="py-3 px-2 text-center">GF</th>
                      <th className="py-3 px-2 text-center">GC</th>
                      <th className="py-3 px-2 text-center">DG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teams.map((team, idx) => {
                      const isFirstOrSecond = idx < 2;
                      const isQualifiedThird = idx === 2 && isBestThird(team.name);
                      
                      let badge = null;
                      let rowBg = "";
                      
                      if (isFirstOrSecond) {
                        badge = <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" title="Clasificado Directo" />;
                        rowBg = "bg-green-500/2";
                      } else if (isQualifiedThird) {
                        badge = <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500" title="Clasificado como Mejor Tercero" />;
                        rowBg = "bg-yellow-500/2";
                      }

                      return (
                        <tr key={team.name} className={`text-xs transition-colors hover:bg-white/2 ${rowBg}`}>
                          {/* Position */}
                          <td className="py-3 px-4 text-center font-bold text-white/60 flex items-center justify-center gap-1">
                            {idx + 1}
                            {badge}
                          </td>
                          {/* Team Flag & Name */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2 font-bold text-white">
                              <img 
                                src={getFlag(team.name)} 
                                alt={team.name} 
                                className="w-5 h-5 rounded-full object-cover border border-white/10" 
                              />
                              <span className="truncate max-w-[100px] md:max-w-[120px] uppercase tracking-tight">{team.name}</span>
                            </div>
                          </td>
                          {/* Points */}
                          <td className="py-3 px-2 text-center font-black text-yellow-500 text-sm">
                            {team.pts}
                          </td>
                          {/* Played Matches */}
                          <td className="py-3 px-2 text-center text-white/80">
                            {team.pj}
                          </td>
                          {/* Goals For */}
                          <td className="py-3 px-2 text-center text-white/50">
                            {team.gf}
                          </td>
                          {/* Goals Against */}
                          <td className="py-3 px-2 text-center text-white/50">
                            {team.gc}
                          </td>
                          {/* Goal Difference */}
                          <td className={`py-3 px-2 text-center font-bold ${team.dg > 0 ? "text-green-500" : team.dg < 0 ? "text-red-500" : "text-white/40"}`}>
                            {team.dg > 0 ? `+${team.dg}` : team.dg}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* BEST THIRDS SECTION */}
      <div className="mt-16 bg-[#16191f] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-yellow-600/10 to-transparent px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black font-montserrat flex items-center gap-3 italic tracking-tight uppercase text-white">
              <span className="text-yellow-500">📊</span> Tabla de <span className="text-yellow-500">Terceros</span>
            </h2>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-bold">
              Clasificación general de los equipos que quedaron en 3° lugar
            </p>
          </div>
          <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider">
            Los mejores 8 avanzan a 16vos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black text-white/40 uppercase tracking-wider bg-black/20">
                <th className="py-4 px-6 text-center w-12">#</th>
                <th className="py-4 px-4 text-center w-16">Grupo</th>
                <th className="py-4 px-4">Equipo</th>
                <th className="py-4 px-4 text-center w-24">Puntos</th>
                <th className="py-4 px-4 text-center w-20">PJ</th>
                <th className="py-4 px-4 text-center w-20">GF</th>
                <th className="py-4 px-4 text-center w-20">GC</th>
                <th className="py-4 px-4 text-center w-20">DG</th>
                <th className="py-4 px-6 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* Combine qualified and non-qualified thirds for complete visibility */}
              {(() => {
                // To display all thirds, compute standings again
                const allThirds: TeamStats[] = [];
                Object.values(standings).forEach(teams => {
                  if (teams[2]) allThirds.push(teams[2]);
                });
                
                // Sort them
                allThirds.sort((a, b) => {
                  if (b.pts !== a.pts) return b.pts - a.pts;
                  if (b.dg !== a.dg) return b.dg - a.dg;
                  if (b.gf !== a.gf) return b.gf - a.gf;
                  return a.name.localeCompare(b.name);
                });

                return allThirds.map((team, idx) => {
                  const qualifies = idx < 8;
                  const rowBg = qualifies ? "bg-green-500/2" : "bg-red-500/2";

                  return (
                    <tr key={team.name} className={`text-sm transition-colors hover:bg-white/2 ${rowBg}`}>
                      {/* Position */}
                      <td className="py-4 px-6 text-center font-black text-white/50">
                        #{idx + 1}
                      </td>
                      {/* Group */}
                      <td className="py-4 px-4 text-center">
                        <span className="bg-white/5 border border-white/5 text-white/70 px-2.5 py-1 rounded-lg text-xs font-black">
                          {team.group}
                        </span>
                      </td>
                      {/* Flag and Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 font-black text-white">
                          <img 
                            src={getFlag(team.name)} 
                            alt={team.name} 
                            className="w-6 h-6 rounded-full object-cover border border-white/10" 
                          />
                          <span className="uppercase tracking-tight text-xs md:text-sm">{team.name}</span>
                        </div>
                      </td>
                      {/* Points */}
                      <td className="py-4 px-4 text-center font-black text-yellow-500 text-base">
                        {team.pts}
                      </td>
                      {/* Played */}
                      <td className="py-4 px-4 text-center text-white/80 font-bold">
                        {team.pj}
                      </td>
                      {/* Goals For */}
                      <td className="py-4 px-4 text-center text-white/40 font-semibold">
                        {team.gf}
                      </td>
                      {/* Goals Against */}
                      <td className="py-4 px-4 text-center text-white/40 font-semibold">
                        {team.gc}
                      </td>
                      {/* Goal Difference */}
                      <td className={`py-4 px-4 text-center font-black text-sm ${team.dg > 0 ? "text-green-500" : team.dg < 0 ? "text-red-500" : "text-white/40"}`}>
                        {team.dg > 0 ? `+${team.dg}` : team.dg}
                      </td>
                      {/* Status */}
                      <td className="py-4 px-6 text-right">
                        {qualifies ? (
                          <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider inline-block">
                            Clasificado ✓
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider inline-block">
                            Eliminado ✕
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
