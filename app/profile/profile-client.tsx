"use client";

import { useState } from "react";
import { getFlag } from "@/lib/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfileClient({ 
  user, 
  allMatches, 
  activePhases = [], 
  results = {} 
}: { 
  user: any; 
  allMatches: any[]; 
  activePhases?: string[]; 
  results?: Record<string, any>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasEditedOnce, setHasEditedOnce] = useState(user.predictions_edited || false);
  const [editedPreds, setEditedPreds] = useState<Record<string, any>>({ ...user.predictions });
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // type: 'success' | 'error' | ''
  const [showConfirm, setShowConfirm] = useState(false);

  const finals = user.finals || { campeon: "", subcampeon: "", tercer_lugar: "", cuarto_lugar: "" };

  // Helper to check if a match has passed (either has results or kickoff date/time is past)
  function isMatchPassed(match: any) {
    if (results[match.id] && results[match.id].homeGoals != null && results[match.id].awayGoals != null) {
      return true;
    }
    if (!match.date || !match.time) return false;
    try {
      // Date format is YYYY-MM-DD, time format is HH:MM in Colombian time (UTC-5)
      const matchDateTimeStr = `${match.date}T${match.time}:00-05:00`;
      const matchTime = new Date(matchDateTimeStr).getTime();
      return Date.now() >= matchTime;
    } catch (e) {
      return false;
    }
  }

  // Filter only group stage matches
  const groupMatches = allMatches.filter(m => !["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"].includes(m.group));

  // Determine editable matches (group stage matches that have not passed yet, AND the 'grupos' phase is active in settings)
  const isGruposActive = activePhases.includes("grupos");
  const editableMatches = isGruposActive ? groupMatches.filter(m => !isMatchPassed(m)) : [];
  const hasEditableMatches = editableMatches.length > 0;

  const handleInputChange = (matchId: string, field: "goles_local" | "goles_visitante", val: string) => {
    const num = val === "" ? null : parseInt(val, 10);
    setEditedPreds(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { local: "", visitante: "" }),
        [field]: num
      }
    }));
  };

  const handleCancel = () => {
    setEditedPreds({ ...user.predictions });
    setIsEditing(false);
    setMsg({ type: "", text: "" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg({ type: "", text: "" });
    try {
      // Filter predictions of editable matches to save
      const predsToSave: Record<string, any> = {};
      editableMatches.forEach(m => {
        const p = editedPreds[m.id];
        if (p) {
          predsToSave[m.id] = {
            goles_local: p.goles_local,
            goles_visitante: p.goles_visitante
          };
        }
      });

      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveUserPredictions",
          userId: user.userId,
          predictions: predsToSave
        })
      });

      const data = await res.json();
      if (data.success) {
        setHasEditedOnce(true);
        setIsEditing(false);
        setMsg({ 
          type: "success", 
          text: "Pronósticos actualizados correctamente. Tus resultados de fase de grupos ahora están bloqueados." 
        });
      } else {
        setMsg({ type: "error", text: data.error || "Ocurrió un error al guardar" });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: "Error de red: " + e.message });
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191f] border border-yellow-500/30 rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h4 className="text-xl font-black uppercase font-montserrat text-white mb-2">¿Confirmar Cambios?</h4>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              Solo puedes modificar tus pronósticos de partidos futuros <strong className="text-yellow-500">una sola vez</strong>. Una vez guardados, no podrás volver a editarlos y se bloquearán definitivamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all"
              >
                Atrás
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Sí, Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 max-h-[700px] overflow-y-auto">
        <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-[#16191f] p-4 rounded-xl -mt-4 z-10 border border-white/5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase font-montserrat text-white">⚽ Mis Predicciones</h3>
              <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest">Fase de Grupos</p>
            </div>
            
            {/* Action Buttons / Statuses */}
            {hasEditedOnce ? (
              <span className="text-[8px] bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-1 rounded-lg uppercase font-black tracking-widest flex items-center gap-1">
                🔒 Bloqueado (Editado)
              </span>
            ) : !hasEditableMatches ? (
              <span className="text-[8px] bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-1 rounded-lg uppercase font-black tracking-widest">
                🔒 Cerrado
              </span>
            ) : isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-black text-[9px] uppercase px-3 py-1.5 rounded-lg transition-transform hover:scale-105"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-yellow-500/25 hover:bg-yellow-500 text-yellow-500 hover:text-black border border-yellow-500/30 font-black text-[9px] uppercase px-3 py-1.5 rounded-lg transition-all"
              >
                ✏️ Editar futuras
              </button>
            )}
          </div>

          {/* Alert Messages */}
          {msg.text && (
            <div className={`p-3 rounded-lg text-xs font-bold text-center border ${
              msg.type === "success" 
                ? "bg-green-500/10 border-green-500/30 text-green-500" 
                : "bg-red-500/10 border-red-500/30 text-red-500"
            }`}>
              {msg.text}
            </div>
          )}

          {!isGruposActive ? (
            <p className="text-[8px] text-red-500/80 uppercase font-black tracking-wider text-center">
              * La fase de grupos está bloqueada. No se pueden modificar los pronósticos.
            </p>
          ) : !hasEditedOnce && hasEditableMatches && !isEditing && (
            <p className="text-[8px] text-yellow-500/80 uppercase font-black tracking-wider text-center animate-pulse">
              * Tienes 1 sola oportunidad para modificar tus pronósticos de partidos futuros.
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {groupMatches.map(m => {
            const matchPred = editedPreds[m.id] || { goles_local: null, goles_visitante: null };
            const passed = isMatchPassed(m);
            const isMatchEditable = !hasEditedOnce && !passed && isEditing;

            return (
              <div 
                key={m.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isMatchEditable 
                    ? "border-yellow-500/30 bg-yellow-500/[0.02]" 
                    : passed
                      ? "border-white/5 bg-white/5 opacity-60"
                      : "border-white/5 bg-[#0f1115] opacity-90"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">
                      {m.date} • {m.group}
                    </p>
                    {passed ? (
                      <span className="text-[7px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-red-500/10">
                        Cerrado
                      </span>
                    ) : isMatchEditable ? (
                      <span className="text-[7px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-yellow-500/20 animate-pulse">
                        ✏️ Editable
                      </span>
                    ) : (
                      <span className="text-[7px] bg-green-500/25 text-green-400 px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-green-500/10">
                        🔓 Futuro
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <img src={getFlag(m.local)} alt={m.local} className="w-5 h-5 object-cover rounded-full" />
                       <p className="font-bold text-xs uppercase text-slate-300">{m.local}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <img src={getFlag(m.visitante)} alt={m.visitante} className="w-5 h-5 object-cover rounded-full" />
                       <p className="font-bold text-xs uppercase text-slate-300">{m.visitante}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 items-end ml-4">
                  {isMatchEditable ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        value={matchPred.goles_local ?? ""}
                        onChange={e => handleInputChange(m.id, "goles_local", e.target.value)}
                        className="w-14 h-8 text-center font-black text-xs rounded-lg bg-black/40 border border-white/15 focus:border-yellow-500 text-yellow-500 outline-none transition-colors"
                        placeholder="-"
                      />
                      <input
                        type="number"
                        min="0"
                        value={matchPred.goles_visitante ?? ""}
                        onChange={e => handleInputChange(m.id, "goles_visitante", e.target.value)}
                        className="w-14 h-8 text-center font-black text-xs rounded-lg bg-black/40 border border-white/15 focus:border-yellow-500 text-yellow-500 outline-none transition-colors"
                        placeholder="-"
                      />
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-8 flex items-center justify-center font-black rounded-lg border bg-black/20 border-white/5 text-white">
                        {matchPred.goles_local ?? "-"}
                      </div>
                      <div className="w-14 h-8 flex items-center justify-center font-black rounded-lg border bg-black/20 border-white/5 text-white">
                        {matchPred.goles_visitante ?? "-"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
