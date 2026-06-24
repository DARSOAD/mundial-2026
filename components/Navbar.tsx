"use client";

import Link from "next/link";
import { getLoggedInUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const u = await getLoggedInUser();
      setUser(u);
    }
    loadUser();
  }, []);

  return (
    <nav className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-yellow-500 tracking-tight uppercase font-montserrat">
              Polla<span className="text-white">Familiar</span>
            </span>
            <span className="text-lg">🇨🇴</span>
          </Link>
          
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400 items-center overflow-x-auto whitespace-nowrap scrollbar-hide py-2 max-w-[60vw] md:max-w-none">
            <Link href="/" className="hover:text-yellow-500 transition-colors">Home</Link>
            <Link href="/leaderboard" className="hover:text-yellow-500 transition-colors">Ranking</Link>
            <Link href="/calendar" className="hover:text-yellow-500 transition-colors">Calendario</Link>
            <Link href="/groups" className="hover:text-yellow-500 transition-colors">Grupos</Link>
            <Link href="/bracket" className="hover:text-yellow-500 transition-colors text-yellow-500">🏆 Eliminatorias</Link>
            
            <span className="text-white/10">|</span>
            
            {user ? (
              <>
                <Link href="/profile" className="text-yellow-500 hover:text-yellow-400 transition-colors">
                  Mi Perfil ({user.name})
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="bg-yellow-500 text-black px-3 py-1 rounded-md hover:bg-yellow-400 transition-colors">
                Entrar
              </Link>
            )}

            {/* Link secreto admin solo para Diego */}
            {user?.userId === 'diego' && (
              <Link href="/admin" className="opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity ml-2">
                ⚙️
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
