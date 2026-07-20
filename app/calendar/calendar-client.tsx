"use client";

import { useState } from "react";
import { getFlag } from "@/lib/flags";
import { getDetailedPoints, getActualPodium, getFinalsPoints, Podium } from "@/lib/scoring";

export default function CalendarClient({ participants, matches, results, currentUser }: any) {
  const [filterUser, setFilterUser] = useState(currentUser ? currentUser.userId : "");

  const filteredParticipants = filterUser 
    ? participants.filter((p: any) => p.userId === filterUser)
    : participants;

  const isSingleUser = !!filterUser && filteredParticipants.length === 1;
  let runningSum = 0;

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-montserrat">
            📅 Calendario <span className="text-yellow-500">& Predicciones</span>
          </h2>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">La matriz completa de la familia</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl">
          <span className="pl-4 text-[10px] font-black uppercase text-white/30 whitespace-nowrap">Filtrar Jugador:</span>
          <select 
            className="bg-[#0f1115] text-white text-sm font-bold border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-yellow-500"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="">Todos los jugadores</option>
            {participants.map((p: any) => (
              <option key={p.userId} value={p.userId}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1rem] md:rounded-[2rem] border border-white/5 shadow-2xl">
        <table className="w-full text-left border-collapse min-w-0">
          <thead>
            <tr className="bg-white/5 text-white">
              <th className="px-3 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-white/40 sticky left-0 bg-[#0f1115] z-20 border-r border-white/5 w-auto">Partido</th>
              <th className="px-2 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-white/40 text-center border-r border-white/5 w-12 md:w-auto">Real</th>
              {filteredParticipants.map((p: any) => (
                <th key={p.userId} className="px-2 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-yellow-500 text-center min-w-[70px] md:min-w-[150px]">
                  {p.name.substring(0, 10)}
                </th>
              ))}
              {isSingleUser && (
                <th className="px-2 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-yellow-500 text-center border-l border-white/5 w-32 whitespace-nowrap">
                  Puntos (Acumulado)
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {matches.map((m: any) => {
              const res = results[m.id];
              const hasResult = res && res.homeGoals != null && res.awayGoals != null;

              let matchPoints = 0;
              let showPointsColumn = false;

              if (isSingleUser) {
                const singleUserObj = filteredParticipants[0];
                const pred = singleUserObj.predictions[m.id];
                if (pred && hasResult) {
                  matchPoints = getDetailedPoints(pred, { ...res, group: m.group, local: m.local, visitante: m.visitante }).totalPoints || 0;
                  runningSum += matchPoints;
                  showPointsColumn = true;
                }
              }

              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-3 py-3 md:p-4 sticky left-0 bg-[#0f1115] z-10 border-r border-white/5 group-hover:bg-white/[0.05]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <img src={getFlag(m.local)} alt={m.local} className="w-6 h-6 md:w-8 md:h-8 object-cover rounded-full border border-white/10 bg-black/40" />
                        <span className="font-bold text-[11px] md:text-xs uppercase tracking-tighter whitespace-nowrap leading-none text-white">{m.local}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img src={getFlag(m.visitante)} alt={m.visitante} className="w-6 h-6 md:w-8 md:h-8 object-cover rounded-full border border-white/10 bg-black/40" />
                        <span className="font-bold text-[11px] md:text-xs uppercase tracking-tighter whitespace-nowrap leading-none text-white/60">{m.visitante}</span>
                      </div>
                      <span className="text-[9px] md:text-[9px] font-black uppercase text-yellow-500 tracking-[0.1em] mt-1">{m.date.split('-').slice(1).join('/')} • {m.time}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 md:p-6 text-center font-black text-sm md:text-base font-montserrat border-r border-white/5 bg-white/5 text-white">
                    {hasResult ? `${res.homeGoals}-${res.awayGoals}` : '-'}
                  </td>
                  {filteredParticipants.map((p: any) => {
                    const pred = p.predictions[m.id];
                    const isExact = res && pred && pred.goles_local === res.homeGoals && pred.goles_visitante === res.awayGoals;
                    
                    return (
                      <td key={p.userId} className={`px-2 py-3 md:p-6 text-center font-bold text-sm md:text-base transition-all ${isExact ? 'bg-yellow-500/10 text-yellow-500 scale-[0.98]' : 'text-white/40'}`}>
                        {pred?.goles_local ?? '-'}:{pred?.goles_visitante ?? '-'}
                      </td>
                    );
                  })}
                  {isSingleUser && (
                    <td className="px-2 py-3 md:p-6 text-center font-black text-xs md:text-sm border-l border-white/5 bg-yellow-500/5 text-yellow-500">
                      {showPointsColumn ? `+${matchPoints} (${runningSum} pts)` : "-"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sección Cuadro de Honor */}
      <div className="mt-16 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <h3 className="text-3xl font-black text-white font-montserrat uppercase tracking-tight flex items-center gap-3">
              🏆 Cuadro de Honor <span className="text-yellow-500">Puntos Finales</span>
            </h3>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">
              Puntajes: Campeón (9 pts) • Subcampeón (6 pts) • 3er Lugar (3 pts) • 4to Lugar (0 pts)
            </p>
          </div>
          {isSingleUser && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-[9px] font-black uppercase text-yellow-500/60">Resumen Puntos del Jugador</span>
              <span className="text-2xl font-black text-yellow-500 font-montserrat">
                {runningSum} <span className="text-xs text-white/40 uppercase">Partidos</span> + {getFinalsPoints(filteredParticipants[0].finals || {}, getActualPodium(matches, results)).totalPoints} <span className="text-xs text-white/40 uppercase">Cuadro</span> = {runningSum + getFinalsPoints(filteredParticipants[0].finals || {}, getActualPodium(matches, results)).totalPoints} <span className="text-xs text-yellow-500 uppercase">Total</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredParticipants.map((p: any) => {
            const pFinals = p.finals || {};
            const actualPodium = getActualPodium(matches, results);
            const finalsPts = getFinalsPoints(pFinals, actualPodium);

            return (
              <div 
                key={p.userId} 
                className="bg-[#0f1115]/80 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-yellow-500/20 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <span className="font-black text-lg text-white group-hover:text-yellow-500 transition-colors">
                      {p.name}
                    </span>
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-black px-3 py-1 rounded-xl">
                      +{finalsPts.totalPoints} pts
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {[
                      { key: 'campeon', label: '1º Lugar - Campeón', pts: 9 },
                      { key: 'subcampeon', label: '2º Lugar - Subcampeón', pts: 6 },
                      { key: 'tercer_lugar', label: '3º Lugar - Tercer Lugar', pts: 3 },
                      { key: 'cuarto_lugar', label: '4º Lugar - Cuarto Lugar', pts: 0 }
                    ].map((pos) => {
                      const userPick = pFinals[pos.key] || "";
                      const actualTeam = actualPodium[pos.key as keyof Podium];
                      const isResolved = actualTeam !== null;
                      
                      const normalize = (name: string | null | undefined) => {
                        if (!name) return "";
                        return name
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/\s+/g, " ")
                          .trim();
                      };

                      const isCorrect = isResolved && normalize(userPick) === normalize(actualTeam);

                      return (
                        <div key={pos.key} className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">
                              {pos.label}
                            </span>
                            {isResolved ? (
                              isCorrect ? (
                                <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                  +{pos.pts} pts
                                </span>
                              ) : (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                  0 pts
                                </span>
                              )
                            ) : (
                              <span className="bg-white/5 text-white/30 border border-white/5 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                Pendiente
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {userPick ? (
                                <>
                                  <img src={getFlag(userPick)} alt={userPick} className="w-5 h-5 object-cover rounded-full border border-white/10" />
                                  <span className="text-xs font-bold text-white uppercase truncate">{userPick}</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-white/20 uppercase italic">Sin elección</span>
                              )}
                            </div>

                            {isResolved && !isCorrect && (
                              <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1">
                                <span className="text-[8px] font-bold text-white/30 uppercase">Real:</span>
                                <img src={getFlag(actualTeam)} alt={actualTeam} className="w-4 h-4 object-cover rounded-full border border-white/10" />
                                <span className="text-[10px] font-bold text-white/60 uppercase truncate">{actualTeam}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
