"use client";

import { useEffect, useState } from "react";
import { getResults, getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getLoggedInUser } from "@/lib/auth";
import CalendarClient from "./calendar-client";

export default function CalendarPage() {
  const [data, setData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [results, participants, m, u] = await Promise.all([
        getResults(),
        getParticipants(),
        getAllMatches(),
        getLoggedInUser()
      ]);
      setData({ participants, realResults: results });
      setMatches(m);
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
