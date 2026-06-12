"use client";

import { useState } from "react";
import { updateParticipantPredictions } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";
import { getFlag } from "@/lib/flags";

export default function BracketClient({ user, knockoutMatches, activePhases }: { user: any, knockoutMatches: any[], activePhases: string[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [preds, setPreds] = useState<Record<string, any>>(user.predictions || {});

  const handleMatchChange = (matchId: string, field: 'goles_local' | 'goles_visitante', value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    setPreds(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || {}),
        [field]: numValue
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateParticipantPredictions(user.userId, preds, user.finals);
    if (result.success) {
      alert("✅ ¡Tus pronósticos de eliminatorias se han guardado!");
      router.refresh();
    } else {
      alert("❌ Hubo un error al guardar");
    }
    setIsSaving(false);
  };

  // Agrupamos los partidos por fase para renderizarlos en columnas
  const phasesOrder = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"];
  
  return (
    <div className="flex flex-col">
      {/* BOTON MAESTRO GUARDAR */}
      <div className="flex justify-end mb-8 sticky top-20 z-50">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-sm transition-all disabled:opacity-50 shadow-2xl shadow-yellow-500/30 flex items-center gap-2"
        >
          {isSaving ? "Guardando..." : "💾 Guardar Predicciones"}
        </button>
      </div>

      {/* RENDERIZADO DEL BRACKET (Columnas Flex) */}
      <div className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-10">
        {phasesOrder.map(phaseName => {
          const matchesInPhase = knockoutMatches.filter(m => m.group === phaseName);
          
          if (matchesInPhase.length === 0) return null; // No mostrar columna si no hay partidos

          // Convertir "16VOS" a "16vos" para comparar con activePhases
          const phaseId = phaseName.toLowerCase();
          const isPhaseActive = activePhases.includes(phaseId);

          return (
            <div key={phaseName} className="flex-1 min-w-[300px] flex flex-col gap-4">
              <div className={`p-4 rounded-2xl text-center border-b-4 ${isPhaseActive ? 'bg-yellow-500/10 border-yellow-500' : 'bg-white/5 border-white/10 opacity-50'}`}>
                <h3 className={`font-black uppercase tracking-widest ${isPhaseActive ? 'text-yellow-500' : 'text-white/40'}`}>
                  {phaseName}
                </h3>
                <p className="text-[9px] uppercase font-bold text-white/30 mt-1">
                  {isPhaseActive ? 'Abierto para predicción' : 'Fase Bloqueada'}
                </p>
              </div>

              {matchesInPhase.map(m => {
                const matchPred = preds[m.id] || { goles_local: null, goles_visitante: null };
                
                return (
                  <div key={m.id} className={`p-5 rounded-2xl border transition-all ${isPhaseActive ? 'bg-[#16191f] border-white/10 hover:border-yellow-500/50' : 'bg-[#0f1115] border-white/5 opacity-40 grayscale'}`}>
                    <p className="text-[8px] font-black uppercase text-yellow-500 tracking-wider text-center mb-3">
                      {m.date} • {m.time}
                    </p>
                    
                    <div className="flex items-center justify-between gap-4">
                      {/* LOCAL */}
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-2xl mb-1">{getFlag(m.local)}</span>
                        <span className="text-[10px] font-bold uppercase text-center leading-none text-white/80 h-6">
                          {m.local}
                        </span>
                        <input 
                          type="number" min="0"
                          value={matchPred.goles_local ?? ""}
                          disabled={!isPhaseActive}
                          onChange={(e) => handleMatchChange(m.id, 'goles_local', e.target.value)}
                          className={`w-12 h-10 mt-2 text-center font-black text-lg rounded-lg outline-none border ${!isPhaseActive ? 'bg-transparent border-transparent text-white/50 cursor-not-allowed' : 'bg-black/50 border-white/10 focus:border-yellow-500 focus:bg-yellow-500/10 text-white'}`}
                          placeholder="-"
                        />
                      </div>

                      <span className="font-black text-white/20 text-xs italic">VS</span>

                      {/* VISITANTE */}
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-2xl mb-1">{getFlag(m.visitante)}</span>
                        <span className="text-[10px] font-bold uppercase text-center leading-none text-white/80 h-6">
                          {m.visitante}
                        </span>
                        <input 
                          type="number" min="0"
                          value={matchPred.goles_visitante ?? ""}
                          disabled={!isPhaseActive}
                          onChange={(e) => handleMatchChange(m.id, 'goles_visitante', e.target.value)}
                          className={`w-12 h-10 mt-2 text-center font-black text-lg rounded-lg outline-none border ${!isPhaseActive ? 'bg-transparent border-transparent text-white/50 cursor-not-allowed' : 'bg-black/50 border-white/10 focus:border-yellow-500 focus:bg-yellow-500/10 text-white'}`}
                          placeholder="-"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
