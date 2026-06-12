"use client";

import { useState } from "react";
import { getFlag } from "@/lib/flags";

export default function CalendarClient({ participants, matches, results, currentUser }: any) {
  const [filterUser, setFilterUser] = useState(currentUser ? currentUser.userId : "");

  const filteredParticipants = filterUser 
    ? participants.filter((p: any) => p.userId === filterUser)
    : participants;

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
          <span className="pl-4 text-[10px] font-black uppercase text-white/30">Filtrar Jugador:</span>
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
            <tr className="bg-white/5">
              <th className="px-3 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-white/40 sticky left-0 bg-[#0f1115] z-20 border-r border-white/5 w-auto">Partido</th>
              <th className="px-2 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-white/40 text-center border-r border-white/5 w-12 md:w-auto">Real</th>
              {filteredParticipants.map((p: any) => (
                <th key={p.userId} className="px-2 py-3 md:p-6 text-[11px] md:text-xs font-black uppercase tracking-widest text-yellow-500 text-center min-w-[70px] md:min-w-[150px]">
                  {p.name.substring(0, 10)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {matches.map((m: any) => {
              const res = results[m.id];
              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-3 py-3 md:p-4 sticky left-0 bg-[#0f1115] z-10 border-r border-white/5 group-hover:bg-white/[0.05]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg md:text-xl leading-none">{getFlag(m.local)}</span>
                        <span className="font-bold text-[11px] md:text-xs uppercase tracking-tighter whitespace-nowrap leading-none">{m.local}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg md:text-xl leading-none">{getFlag(m.visitante)}</span>
                        <span className="font-bold text-[11px] md:text-xs uppercase tracking-tighter whitespace-nowrap leading-none text-white/60">{m.visitante}</span>
                      </div>
                      <span className="text-[9px] md:text-[9px] font-black uppercase text-yellow-500 tracking-[0.1em] mt-1">{m.date.split('-').slice(1).join('/')} • {m.time}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 md:p-6 text-center font-black text-sm md:text-base font-montserrat border-r border-white/5 bg-white/5">
                    {res ? `${res.home}-${res.away}` : '-'}
                  </td>
                  {filteredParticipants.map((p: any) => {
                    const pred = p.predictions[m.id];
                    const isExact = res && pred && pred.goles_local === res.home && pred.goles_visitante === res.away;
                    
                    return (
                      <td key={p.userId} className={`px-2 py-3 md:p-6 text-center font-bold text-sm md:text-base transition-all ${isExact ? 'bg-yellow-500/10 text-yellow-500 scale-[0.98]' : 'text-white/40'}`}>
                        {pred?.goles_local ?? '-'}:{pred?.goles_visitante ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
