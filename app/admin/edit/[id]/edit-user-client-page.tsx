"use client";

import { useEffect, useState } from "react";
import { getParticipants } from "@/lib/data";
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
      const [u, participants, m] = await Promise.all([
        getLoggedInUser(),
        getParticipants(),
        getAllMatches()
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

      setUserToEdit(target);
      setAllMatches(m);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">Cargando Editor...</div>;
  if (!userToEdit) return notFound();

  return <EditUserForm user={userToEdit} allMatches={allMatches} />;
}
