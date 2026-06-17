"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import RegisterClient from "./register-client";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const user = await getLoggedInUser();
      if (user) {
        window.location.href = '/mundial-2026/profile';
        return;
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando...</div>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 w-full max-w-md backdrop-blur-md shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-montserrat uppercase tracking-tight text-white">
            Nuevo <span className="text-yellow-500">Jugador</span>
          </h2>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Crea tu cuenta para participar</p>
        </div>
        
        <RegisterClient />
        
        <div className="mt-8 text-center">
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
            Al registrarte, heredarás los puntos del último jugador en el ranking.
          </p>
        </div>
      </div>
    </div>
  );
}
