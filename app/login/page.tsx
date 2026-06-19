"use client";

import { useEffect, useState } from "react";
import { getParticipants } from "@/lib/data";
import LoginClient from "./login-client";
import { getLoggedInUser } from "@/lib/auth";

export default function LoginPage() {
  const [usersForLogin, setUsersForLogin] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await getLoggedInUser();
      if (user) {
        window.location.href = '/mundial-2026/profile/';
        return;
      }

      const participants = await getParticipants();
      const users = participants.map((p: any) => ({
        userId: p.userId,
        name: p.name
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setUsersForLogin(users);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando...</div>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 w-full max-w-md backdrop-blur-md shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-montserrat uppercase tracking-tight text-white">
            Ingreso <span className="text-yellow-500">Familiar</span>
          </h2>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Para llenar tus pronósticos</p>
        </div>
        
        <LoginClient users={usersForLogin} />
      </div>
    </div>
  );
}
