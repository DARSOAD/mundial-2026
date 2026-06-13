"use client";

import { togglePhase } from "@/lib/admin-actions";
import { useTransition } from "react";

interface PhaseToggleProps {
  phaseId: string;
  label: string;
  isActive: boolean;
}

export default function PhaseToggle({ phaseId, label, isActive }: PhaseToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePhase(phaseId, !isActive);
    });
  };

  return (
    <div className={`border p-4 rounded-xl flex items-center justify-between transition-colors ${isActive ? 'bg-white/5 border-green-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
      <div>
        <p className="font-bold uppercase text-sm">{label}</p>
        <p className={`text-[10px] font-black uppercase ${isActive ? 'text-green-500' : 'text-white/40'}`}>
          {isActive ? 'Activa' : 'Bloqueada'}
        </p>
      </div>
      <button 
        onClick={handleToggle}
        disabled={isPending}
        className={`text-xs font-black px-3 py-1 rounded transition-colors ${isActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {isPending ? '...' : isActive ? 'Bloquear' : 'Habilitar'}
      </button>
    </div>
  );
}
