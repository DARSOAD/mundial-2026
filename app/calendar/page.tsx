"use client";

import { useEffect, useState } from "react";
import { getResults, getParticipants, getKnockoutMatches } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getLoggedInUser } from "@/lib/auth";
import CalendarClient from "./calendar-client";

function getKnockoutOrder(id: string): number {
  if (id.startsWith("16v_")) return 72 + parseInt(id.split("_")[1], 10);
  if (id.startsWith("8v_")) return 88 + parseInt(id.split("_")[1], 10);
  if (id.startsWith("4v_")) return 96 + parseInt(id.split("_")[1], 10);
  if (id.startsWith("sf_")) return 100 + parseInt(id.split("_")[1], 10);
  if (id === "fin_2") return 103; // Tercer puesto (played on July 18)
  if (id === "fin_1") return 104; // Gran Final (played on July 19)
  return 1000;
}

export default function CalendarPage() {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [results, participants, m, km, u] = await Promise.all([
        getResults(),
        getParticipants(),
        getAllMatches(),
        getKnockoutMatches(),
        getLoggedInUser()
      ]);

      const mappedKnockouts = km.map((m: any) => ({
        id: m.id,
        local: m.local || "Por Definir",
        visitante: m.visitante || "Por Definir",
        date: m.date,
        time: m.time,
        group: m.group || m.phase.toUpperCase(),
        order: getKnockoutOrder(m.id),
        homeIsPredLocal: true,
        calendarHome: m.local,
        calendarAway: m.visitante
      }));

      const combinedMatches = [...m, ...mappedKnockouts].sort((a, b) => a.order - b.order);

      setData({ participants, realResults: results });
      setMatches(combinedMatches);
      setUser(u);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando Calendario...</div>;

  const participants = data?.participants || [];
  const realResults = data?.realResults || {};

  return <CalendarClient participants={participants} matches={matches} results={realResults} currentUser={user} />;
}
