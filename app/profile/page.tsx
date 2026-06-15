"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getAllMatches } from "@/lib/matches";
import { getSystemSettings } from "@/lib/data";
import ProfileClient from "./profile-client";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [activePhases, setActivePhases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, m, settings] = await Promise.all([
        getLoggedInUser(),
        getAllMatches(),
        getSystemSettings()
      ]);

      if (!u) {
        window.location.href = '/mundial-2026/login';
        return;
      }

      setUser(u);
      setMatches(m);
      setActivePhases(settings?.activePhases || ["grupos"]);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando Perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-montserrat">
          Hola, <span className="text-yellow-500">{user.name}</span>
        </h2>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Bienvenido a tu panel de pronósticos</p>
      </div>

      <ProfileClient user={user} allMatches={matches} activePhases={activePhases} />
    </div>
  );
}
