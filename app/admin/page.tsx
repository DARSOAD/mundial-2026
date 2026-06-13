"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getParticipants, getSystemSettings } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import Link from "next/link";
import PhaseToggle from "./phase-toggle";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, participants, m, settings] = await Promise.all([
        getLoggedInUser(),
        getParticipants(),
        getAllMatches(),
        getSystemSettings()
      ]);
      
      if (!u || u.userId !== 'diego') {
        window.location.href = '/mundial-2026/';
        return;
      }

      setUser(u);
      setData({ participants, settings });
      setMatches(m);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">Verificando Admin...</div>;

  const participants = data.participants;
  const activePhases = data.settings.activePhases || [];

  const usersWithStatus = participants.map((p: any) => {
    let missingMatches = 0;
    let missingFinals = 0;
    Object.values(p.predictions).forEach((pred: any) => {
      if (pred.goles_local === null || pred.goles_visitante === null) missingMatches++;
    });
    const finals = p.finals || {};
    if (!finals.campeon) missingFinals++;
    if (!finals.subcampeon) missingFinals++;
    if (!finals.tercer_lugar) missingFinals++;
    if (!finals.cuarto_lugar) missingFinals++;
    return { ...p, missingMatches, missingFinals, isComplete: missingMatches === 0 && missingFinals === 0 };
  });

  usersWithStatus.sort((a: any, b: any) => a.isComplete === b.isComplete ? a.name.localeCompare(b.name) : (a.isComplete ? 1 : -1));

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black text-white uppercase font-montserrat">⚙️ Panel Admin</h2>
        <button className="bg-yellow-500 text-black font-black px-6 py-3 rounded-xl text-xs uppercase">Sincronizar API</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-red-600/10"><h3 className="font-black uppercase">Estado Predicciones</h3></div>
          <div className="divide-y divide-white/5">
            {usersWithStatus.map((u: any) => (
              <div key={u.userId} className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-bold">{u.name}</p>
                  <p className="text-[10px] text-white/40 uppercase">Partidos: {u.missingMatches} faltantes | Finales: {u.missingFinals} faltantes</p>
                </div>
                <Link href={`/admin/edit/${u.userId}`} className="bg-white/10 px-4 py-2 rounded-lg font-bold text-[10px] uppercase">Editar</Link>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
           <h3 className="font-black uppercase mb-6 text-blue-500">Fases</h3>
           <div className="flex flex-col gap-4">
              {["grupos", "16vos", "octavos", "cuartos", "semis", "final"].map(f => (
                <PhaseToggle key={f} phaseId={f} label={f.toUpperCase()} isActive={activePhases.includes(f)} />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
