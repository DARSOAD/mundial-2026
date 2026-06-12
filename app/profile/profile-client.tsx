"use client";

import { useState } from "react";
import { updateParticipantPredictions } from "@/lib/admin-actions"; // We can reuse this server action for now
import { useRouter } from "next/navigation";

export default function ProfileClient({ user, allMatches }: { user: any, allMatches: any[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [preds, setPreds] = useState<Record<string, any>>(user.predictions || {});
  const [finals, setFinals] = useState(user.finals || { campeon: "", subcampeon: "", tercer_lugar: "", cuarto_lugar: "" });

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

  const handleFinalsChange = (field: string, value: string) => {
    setFinals(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateParticipantPredictions(user.userId, preds, finals);
    if (result.success) {
      alert("✅ ¡Tus pronósticos se han guardado!");
      router.refresh();
    } else {
      alert("❌ Hubo un error al guardar");
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* SECCIÓN FINALES */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col h-full">
        <h3 className="text-xl font-black uppercase font-montserrat text-yellow-500 mb-2">🏆 Cuadro de Honor</h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-6">Tus elecciones finales (Solo lectura)</p>
        
        <div className="flex flex-col gap-4 flex-1">
          {['campeon', 'subcampeon', 'tercer_lugar', 'cuarto_lugar'].map((pos, i) => (
            <div key={pos}>
              <label className="text-xs font-black uppercase text-white/50 mb-1 block">
                {i+1}º Lugar
              </label>
              <input 
                type="text"
                value={finals[pos] || ""}
                disabled
                className="w-full bg-[#0f1115]/50 border border-white/5 rounded-xl px-4 py-3 font-bold outline-none text-white/50 cursor-not-allowed"
                placeholder="Sin elección"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN PARTIDOS */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#16191f] p-4 rounded-xl -mt-4 z-10 border border-white/5 shadow-lg">
          <div>
            <h3 className="text-xl font-black uppercase font-montserrat text-white">⚽ Partidos</h3>
            <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest">Solo fases habilitadas</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-black px-6 py-2 rounded-lg uppercase tracking-widest text-xs transition-all disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Todo"}
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {allMatches.map(m => {
            const matchPred = preds[m.id] || { goles_local: null, goles_visitante: null };
            // Simulación de fase activa: Solo los partidos sin pronóstico se pueden editar
            // En el futuro, esto se conectará a las fases reales habilitadas por el admin
            const isLocked = (matchPred.goles_local !== null && matchPred.goles_visitante !== null);
            
            return (
              <div key={m.id} className={`flex items-center justify-between p-4 rounded-xl border ${isLocked ? 'border-white/5 bg-white/5 opacity-50' : 'border-yellow-500/30 bg-[#0f1115] hover:border-yellow-500'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">{m.date} • {m.time}</p>
                    {isLocked && <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Cerrado</span>}
                  </div>
                  <p className="font-bold text-sm uppercase text-slate-300">{m.local}</p>
                  <p className="font-bold text-sm uppercase text-slate-300">{m.visitante}</p>
                </div>
                
                <div className="flex flex-col gap-1 items-end ml-4">
                  <input 
                    type="number" min="0"
                    value={matchPred.goles_local ?? ""}
                    disabled={isLocked}
                    onChange={(e) => handleMatchChange(m.id, 'goles_local', e.target.value)}
                    className={`w-14 h-8 text-center font-black rounded-lg outline-none border ${isLocked ? 'bg-transparent border-transparent text-white/50 cursor-not-allowed' : 'bg-white/5 border-white/10 focus:border-yellow-500 text-white'}`}
                    placeholder="-"
                  />
                  <input 
                    type="number" min="0"
                    value={matchPred.goles_visitante ?? ""}
                    disabled={isLocked}
                    onChange={(e) => handleMatchChange(m.id, 'goles_visitante', e.target.value)}
                    className={`w-14 h-8 text-center font-black rounded-lg outline-none border ${isLocked ? 'bg-transparent border-transparent text-white/50 cursor-not-allowed' : 'bg-white/5 border-white/10 focus:border-yellow-500 text-white'}`}
                    placeholder="-"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
