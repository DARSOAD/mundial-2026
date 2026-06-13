"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getAllMatches } from "@/lib/matches";
import { getSnapshotData } from "@/lib/data";
import BracketClient from "./bracket-client";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);
  const [knockoutMatches, setKnockoutMatches] = useState<any[]>([]);
  const [activePhases, setActivePhases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, m, snap] = await Promise.all([
        getLoggedInUser(),
        getAllMatches(),
        getSnapshotData()
      ]);
      
      if (!u) {
        window.location.href = '/mundial-2026/login';
        return;
      }

      const ko = m.filter(match => ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"].includes(match.group));

      setUser(u);
      setKnockoutMatches(ko);
      setActivePhases(snap.settings?.activePhases || ["grupos"]);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Dibujando Camino a la Gloria...</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase font-montserrat">
          Camino a la <span className="text-yellow-500">Gloria</span>
        </h2>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Llaves de Eliminación Directa</p>
      </div>

      <BracketClient 
        user={user} 
        knockoutMatches={knockoutMatches} 
        activePhases={activePhases} 
      />
    </div>
  );
}
