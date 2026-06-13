"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function NavbarClient({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-yellow-500 tracking-tight uppercase font-montserrat">
            Polla<span className="text-white">Familiar</span>
          </span>
          <span className="text-lg">🇨🇴</span>
        </Link>
        
        {/* DESKTOP MENU */}
        <div className="hidden md:flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400 items-center">
          <Link href="/" className="hover:text-yellow-500 transition-colors">Home</Link>
          <Link href="/leaderboard" className="hover:text-yellow-500 transition-colors">Ranking</Link>
          <Link href="/calendar" className="hover:text-yellow-500 transition-colors">Calendario</Link>
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

          <Link href="/admin" className="opacity-10 hover:opacity-100 hover:text-red-500 transition-opacity ml-2">
            ⚙️
          </Link>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0f1115] border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col gap-4 text-base font-black uppercase tracking-widest text-slate-300">
            <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-yellow-500 border-b border-white/5 pb-2">Home</Link>
            <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="hover:text-yellow-500 border-b border-white/5 pb-2">Ranking Oficial</Link>
            <Link href="/calendar" onClick={() => setIsOpen(false)} className="hover:text-yellow-500 border-b border-white/5 pb-2">Calendario y Predicciones</Link>
            <Link href="/bracket" onClick={() => setIsOpen(false)} className="text-yellow-500 border-b border-white/5 pb-2">🏆 Llaves Eliminatorias</Link>
          </div>
          
          <div className="pt-4 flex flex-col gap-4 border-t border-white/10">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setIsOpen(false)} className="text-yellow-500 font-bold text-center border border-yellow-500/30 py-3 rounded-xl bg-yellow-500/10">
                  Mi Perfil ({user.name})
                </Link>
                <div className="text-center text-sm font-bold mt-2" onClick={() => setIsOpen(false)}>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="bg-yellow-500 text-black font-black text-center py-3 rounded-xl uppercase tracking-widest">
                Iniciar Sesión
              </Link>
            )}
            
            <Link href="/admin" onClick={() => setIsOpen(false)} className="opacity-20 hover:opacity-100 hover:text-red-500 text-center font-bold text-xs uppercase mt-4">
              Panel de Control (Admin)
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
