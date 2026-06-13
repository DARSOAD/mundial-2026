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

  // Helper para renderizar un partido en el bracket
  const renderMatch = (m: any, phaseId: string) => {
    if (!m) return <div className="w-[200px] h-[80px] bg-white/5 border border-white/5 rounded-xl opacity-20 flex items-center justify-center text-[10px] text-white/30 uppercase tracking-widest">Por Definir</div>;

    const isPhaseActive = activePhases.includes(phaseId);
    const matchPred = preds[m.id] || { goles_local: null, goles_visitante: null };

    return (
      <div className={`w-[220px] p-3 rounded-xl border relative z-10 transition-all ${isPhaseActive ? 'bg-[#16191f] border-white/20 shadow-lg shadow-black/50 hover:border-yellow-500/50' : 'bg-[#0f1115] border-white/5 opacity-60'}`}>
        <p className="text-[7px] font-black uppercase text-yellow-500 tracking-wider text-center mb-2">
          {m.date}
        </p>
        <div className="flex flex-col gap-1">
          {/* LOCAL */}
          <div className="flex items-center justify-between bg-black/40 rounded px-2 py-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={getFlag(m.local)} alt={m.local} className="w-5 h-5 object-cover rounded-full bg-black/20" />
              <span className="text-[10px] font-bold uppercase truncate text-white">{m.local}</span>
            </div>
            <input 
              type="number" min="0"
              value={matchPred.goles_local ?? ""}
              disabled={!isPhaseActive}
              onChange={(e) => handleMatchChange(m.id, 'goles_local', e.target.value)}
              className={`w-8 h-6 text-center font-black text-xs rounded outline-none border ${!isPhaseActive ? 'bg-transparent border-transparent text-white/50' : 'bg-[#1a1d24] border-white/10 focus:border-yellow-500 text-yellow-500'}`}
            />
          </div>
          {/* VISITANTE */}
          <div className="flex items-center justify-between bg-black/40 rounded px-2 py-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={getFlag(m.visitante)} alt={m.visitante} className="w-5 h-5 object-cover rounded-full bg-black/20" />
              <span className="text-[10px] font-bold uppercase truncate text-white">{m.visitante}</span>
            </div>
            <input 
              type="number" min="0"
              value={matchPred.goles_visitante ?? ""}
              disabled={!isPhaseActive}
              onChange={(e) => handleMatchChange(m.id, 'goles_visitante', e.target.value)}
              className={`w-8 h-6 text-center font-black text-xs rounded outline-none border ${!isPhaseActive ? 'bg-transparent border-transparent text-white/50' : 'bg-[#1a1d24] border-white/10 focus:border-yellow-500 text-yellow-500'}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const getPhaseMatches = (group: string) => knockoutMatches.filter(m => m.group === group);
  const mfin = getPhaseMatches("FINAL");
  
  const createPaddedArray = (matches: any[], size: number) => {
    const arr = [...matches];
    while(arr.length < size) arr.push(null);
    return arr;
  }

  const p16 = createPaddedArray(getPhaseMatches("16VOS"), 16);
  const poct = createPaddedArray(getPhaseMatches("OCTAVOS"), 8);
  const pcua = createPaddedArray(getPhaseMatches("CUARTOS"), 4);
  const psem = createPaddedArray(getPhaseMatches("SEMIS"), 2);

  return (
    <div className="flex flex-col relative min-h-screen">
      <div className="sticky top-16 z-50 bg-gradient-to-b from-[#0f1115] to-transparent pt-4 pb-8 mb-4 flex justify-between items-center px-4">
        <div><p className="text-[10px] text-white/40 uppercase font-black tracking-widest text-white">Llena solo las fases iluminadas</p></div>
        <button onClick={handleSave} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8 py-3 rounded-full uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
          {isSaving ? "Guardando..." : "💾 Guardar Pronósticos"}
        </button>
      </div>

      <div className="overflow-x-auto pb-20 px-4">
        <div className="min-w-[1200px] flex justify-between items-center gap-4 relative">
          <div className="flex gap-4">
            <div className="flex flex-col gap-4 justify-around py-4">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">16vos</h4>
              {p16.slice(0,8).map((m, i) => <div key={i} className="my-1 text-white">{renderMatch(m, "16vos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-16">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Octavos</h4>
              {poct.slice(0,4).map((m, i) => <div key={i} className="my-6 text-white">{renderMatch(m, "octavos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-32">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Cuartos</h4>
              {pcua.slice(0,2).map((m, i) => <div key={i} className="my-12 text-white">{renderMatch(m, "cuartos")}</div>)}
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Semifinal</h4>
              <div className="my-auto text-white">{renderMatch(psem[0], "semis")}</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-12 px-8 min-w-[300px]">
            <div className="flex flex-col items-center text-white">
              <span className="text-4xl mb-2">🏆</span>
              <h3 className="text-xl font-black uppercase font-montserrat text-yellow-500 mb-4 tracking-tighter">Gran Final</h3>
              {renderMatch(mfin[0] || null, "final")}
            </div>
            <div className="flex flex-col items-center mt-12 opacity-80 scale-90 text-white">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">3er Puesto</h3>
              {renderMatch(mfin[1] || null, "final")}
            </div>
          </div>

          <div className="flex gap-4 flex-row-reverse">
            <div className="flex flex-col gap-4 justify-around py-4">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">16vos</h4>
              {p16.slice(8,16).map((m, i) => <div key={i} className="my-1 text-white">{renderMatch(m, "16vos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-16">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Octavos</h4>
              {poct.slice(4,8).map((m, i) => <div key={i} className="my-6 text-white">{renderMatch(m, "octavos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-32">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Cuartos</h4>
              {pcua.slice(2,4).map((m, i) => <div key={i} className="my-12 text-white">{renderMatch(m, "cuartos")}</div>)}
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Semifinal</h4>
              <div className="my-auto text-white">{renderMatch(psem[1], "semis")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
