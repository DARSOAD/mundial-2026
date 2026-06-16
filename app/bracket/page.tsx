"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getKnockoutMatches, getKnockoutPredictions, getResults, getSystemSettings } from "@/lib/data";
import BracketClient from "./bracket-client";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);
  const [knockoutMatches, setKnockoutMatches] = useState<any[]>([]);
  const [allPredictions, setAllPredictions] = useState<Record<string, Record<string, any>>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [activePhases, setActivePhases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, km, kp, r, settings] = await Promise.all([
        getLoggedInUser(),
        getKnockoutMatches(),
        getKnockoutPredictions(),
        getResults(),
        getSystemSettings()
      ]);

      if (!u) {
        window.location.href = '/mundial-2026/login/';
        return;
      }

      setUser(u);
      setKnockoutMatches(km);
      setAllPredictions(kp);
      setResults(r);
      setActivePhases(settings?.activePhases || ["grupos"]);
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
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Llaves de Eliminacion Directa</p>
      </div>

      <BracketClient
        user={user}
        knockoutMatches={knockoutMatches}
        allPredictions={allPredictions}
        results={results}
        activePhases={activePhases}
      />
    </div>
  );
}
