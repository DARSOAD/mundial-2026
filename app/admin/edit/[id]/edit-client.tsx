"use client";

import { useState } from "react";
import { updateParticipantPredictions } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";
import { getFlag } from "@/lib/flags";

export default function EditUserForm({ user, allMatches }: { user: any, allMatches: any[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [preds, setPreds] = useState<Record<string, any>>(user.predictions);
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
    setFinals((prev: Record<string, string>) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateParticipantPredictions(user.userId, preds, finals);
    if (result.success) {
      alert("✅ Datos guardados correctamente");
      router.push("/admin");
      router.refresh();
    } else {
      alert("❌ Hubo un error al guardar");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase font-montserrat text-white text-center md:text-left">Editando: <span className="text-yellow-500">{user.name}</span></h2>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 text-center md:text-left">Panel de Control Maestro</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-black px-8 py-3 rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50 w-full md:w-auto"
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PREDICTOR FINALES */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-fit">
          <h3 className="text-xl font-black uppercase font-montserrat text-yellow-500 mb-6 flex items-center gap-2">🏆 Cuadro de Honor</h3>
          <div className="flex flex-col gap-4">
            {['campeon', 'subcampeon', 'tercer_lugar', 'cuarto_lugar'].map((pos, i) => (
              <div key={pos}>
                <label className="text-[10px] font-black uppercase text-white/50 mb-1 block tracking-wider">
                  {i+1}º Lugar
                </label>
                <input 
                  type="text"
                  value={finals[pos] || ""}
                  onChange={(e) => handleFinalsChange(pos, e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 font-bold focus:border-yellow-500 outline-none text-white shadow-inner"
                  placeholder="Equipo..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* LISTA DE PARTIDOS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-h-[700px] overflow-y-auto shadow-2xl">
          <h3 className="text-xl font-black uppercase font-montserrat text-white mb-6 flex items-center gap-2">⚽ Todos los Partidos</h3>
          <div className="flex flex-col gap-3">
            {allMatches.map(m => {
              const matchPred = preds[m.id] || { local: m.local, visitante: m.visitante, goles_local: null, goles_visitante: null };
              const isMissing = matchPred.goles_local === null || matchPred.goles_visitante === null;

              return (
                <div key={m.id} className={`flex flex-col p-4 rounded-xl border transition-colors ${isMissing ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-[#0f1115]'}`}>
                  <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mb-3">{m.date} • GRUPO {m.group}</p>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <img src={getFlag(m.local)} alt={m.local} className="w-5 h-5 object-cover rounded-full bg-black/20" />
                        <span className="text-[10px] font-bold uppercase text-white truncate">{m.local}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img src={getFlag(m.visitante)} alt={m.visitante} className="w-5 h-5 object-cover rounded-full bg-black/20" />
                        <span className="text-[10px] font-bold uppercase text-white truncate">{m.visitante}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <input 
                        type="number" min="0"
                        value={matchPred.goles_local ?? ""}
                        onChange={(e) => handleMatchChange(m.id, 'goles_local', e.target.value)}
                        className={`w-12 h-8 text-center font-black rounded-lg bg-black/40 outline-none border ${isMissing ? 'border-red-500/50 text-red-500' : 'border-white/10 text-yellow-500'}`}
                        placeholder="-"
                      />
                      <input 
                        type="number" min="0"
                        value={matchPred.goles_visitante ?? ""}
                        onChange={(e) => handleMatchChange(m.id, 'goles_visitante', e.target.value)}
                        className={`w-12 h-8 text-center font-black rounded-lg bg-black/40 outline-none border ${isMissing ? 'border-red-500/50 text-red-500' : 'border-white/10 text-yellow-500'}`}
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
