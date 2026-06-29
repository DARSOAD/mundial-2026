"use client";

import { useEffect, useState } from "react";
import { getParticipants, getKnockoutMatches } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { notFound } from "next/navigation";
import EditUserForm from "./edit-client";
import { getLoggedInUser } from "@/lib/auth";

export default function EditUserClientPage({ id }: { id: string }) {
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, participants, m, km] = await Promise.all([
        getLoggedInUser(),
        getParticipants(),
        getAllMatches(),
        getKnockoutMatches()
      ]);

      if (!u || u.userId !== 'diego') {
        window.location.href = '/mundial-2026/';
        return;
      }

      const target = participants?.find((p: any) => p.userId === id);
      if (!target) {
        setIsLoading(false);
        return;
      }

      // Map knockout matches to match structure
      const mappedKnockouts = km.map((m: any) => ({
        id: m.id,
        local: m.local || "Por Definir",
        visitante: m.visitante || "Por Definir",
        date: m.date,
        time: m.time,
        group: m.group || m.phase.toUpperCase(),
        order: 1000 + parseInt(m.id.split('_')[1] || '0', 10),
        homeIsPredLocal: true,
        calendarHome: m.local,
        calendarAway: m.visitante
      }));

      setUserToEdit(target);
      setAllMatches([...m, ...mappedKnockouts]);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">Cargando Editor...</div>;
  if (!userToEdit) return notFound();

  return <EditUserForm user={userToEdit} allMatches={allMatches} />;
}
