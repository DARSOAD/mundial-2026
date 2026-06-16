"use client";

import { useState } from "react";
import { getFlag } from "@/lib/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PHASE_ORDER = ["16VOS", "OCTAVOS", "CUARTOS", "SEMIS", "FINAL"];
const PHASE_LABELS: Record<string, string> = {
  "16VOS": "16vos", "OCTAVOS": "Octavos", "CUARTOS": "Cuartos",
  "SEMIS": "Semifinal", "FINAL": "Final"
};

export default function BracketClient({
  user, knockoutMatches, allPredictions, results, activePhases
}: {
  user: any;
  knockoutMatches: any[];
  allPredictions: Record<string, Record<string, any>>;
  results: Record<string, any>;
  activePhases: string[];
}) {
  const [preds, setPreds] = useState<Record<string, any>>(allPredictions[user.userId] || {});
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function updatePred(matchId: string, field: string, value: any) {
    setPreds(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value }
    }));
  }

  async function savePrediction(matchId: string) {
    setIsSaving(true);
    setSavedMsg("");
    try {
      const pred = preds[matchId];
      if (!pred || pred.goles_local == null || pred.goles_visitante == null) {
        setSavedMsg("Completa ambos goles");
        setIsSaving(false);
        return;
      }
      // If tie and no team_passes selected, warn
      if (pred.goles_local === pred.goles_visitante && !pred.team_passes) {
        setSavedMsg("Empate: selecciona quien pasa en penales");
        setIsSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveKnockoutPrediction",
          userId: user.userId,
          matchId,
          prediction: pred
        })
      });
      const data = await res.json();
      setSavedMsg(data.success ? "Guardado" : "Error");
    } catch (e: any) {
      setSavedMsg("Error: " + e.message);
    }
    setIsSaving(false);
    setTimeout(() => setSavedMsg(""), 2000);
  }

  if (knockoutMatches.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl mb-4 block">🏟️</span>
        <p className="text-white/40 font-black uppercase tracking-widest text-sm">Las llaves de eliminacion aun no estan definidas</p>
        <p className="text-white/20 text-xs mt-2">El admin las creara cuando termine la fase de grupos</p>
      </div>
    );
  }

  const renderMatch = (m: any, phaseId: string) => {
    if (!m) return <div className="w-[230px] h-[100px] bg-white/5 border border-white/5 rounded-xl opacity-20 flex items-center justify-center text-[10px] text-white/30 uppercase tracking-widest">Por Definir</div>;

    const isPhaseActive = activePhases.includes(phaseId);
    const pred = preds[m.id] || {};
    const result = results[m.id];
    const hasResult = result && result.homeGoals != null && result.awayGoals != null;
    const isTiePred = pred.goles_local != null && pred.goles_visitante != null && pred.goles_local === pred.goles_visitante;

    return (
      <div className={`w-[230px] p-3 rounded-xl border relative transition-all ${
        hasResult ? 'bg-green-500/5 border-green-500/20' :
        isPhaseActive ? 'bg-[#16191f] border-white/20 shadow-lg shadow-black/50' :
        'bg-[#0f1115] border-white/5 opacity-60'
      }`}>
        <p className="text-[7px] font-black uppercase text-yellow-500 tracking-wider text-center mb-2">
          {m.date} {m.time && `• ${m.time}`}
        </p>

        {/* Result bar if finished */}
        {hasResult && (
          <div className="text-center mb-2">
            <span className="text-white font-black text-lg">{result.homeGoals} - {result.awayGoals}</span>
            {result.teamPasses && (
              <span className="text-[8px] text-yellow-500 ml-2 font-black uppercase">
                (pen: {result.teamPasses === 'home' ? m.local : m.visitante})
              </span>
            )}
          </div>
        )}

        {/* LOCAL */}
        <div className="flex items-center justify-between bg-black/40 rounded px-2 py-1 mb-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={getFlag(m.local)} alt={m.local} className="w-5 h-5 object-cover rounded-full bg-black/20" />
            <span className="text-[10px] font-bold uppercase truncate text-white">{m.local}</span>
          </div>
          <input
            type="number" min="0"
            value={pred.goles_local ?? ""}
            disabled={!isPhaseActive || hasResult}
            onChange={e => updatePred(m.id, 'goles_local', e.target.value === "" ? null : parseInt(e.target.value))}
            className={`w-8 h-6 text-center font-black text-xs rounded outline-none border ${
              !isPhaseActive || hasResult ? 'bg-transparent border-transparent text-white/50' :
              'bg-[#1a1d24] border-white/10 focus:border-yellow-500 text-yellow-500'
            }`}
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
            value={pred.goles_visitante ?? ""}
            disabled={!isPhaseActive || hasResult}
            onChange={e => updatePred(m.id, 'goles_visitante', e.target.value === "" ? null : parseInt(e.target.value))}
            className={`w-8 h-6 text-center font-black text-xs rounded outline-none border ${
              !isPhaseActive || hasResult ? 'bg-transparent border-transparent text-white/50' :
              'bg-[#1a1d24] border-white/10 focus:border-yellow-500 text-yellow-500'
            }`}
          />
        </div>

        {/* Penalty selector when prediction is tie */}
        {isTiePred && isPhaseActive && !hasResult && (
          <div className="mt-2 flex gap-1">
            <button
              onClick={() => updatePred(m.id, 'team_passes', 'home')}
              className={`flex-1 text-[8px] font-black uppercase py-1 rounded transition-all ${
                pred.team_passes === 'home' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'
              }`}
            >
              Pasa {m.local}
            </button>
            <button
              onClick={() => updatePred(m.id, 'team_passes', 'away')}
              className={`flex-1 text-[8px] font-black uppercase py-1 rounded transition-all ${
                pred.team_passes === 'away' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'
              }`}
            >
              Pasa {m.visitante}
            </button>
          </div>
        )}

        {/* Save button per match */}
        {isPhaseActive && !hasResult && (
          <button
            onClick={() => savePrediction(m.id)}
            disabled={isSaving}
            className="w-full mt-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-500 font-black text-[8px] uppercase py-1 rounded transition-all disabled:opacity-50"
          >
            Guardar
          </button>
        )}
      </div>
    );
  };

  const getPhaseMatches = (group: string) => knockoutMatches.filter(m => m.group === group || m.phase?.toUpperCase() === group);

  const createPaddedArray = (matches: any[], size: number) => {
    const arr = [...matches];
    while (arr.length < size) arr.push(null);
    return arr;
  };

  const p16 = createPaddedArray(getPhaseMatches("16VOS"), 16);
  const poct = createPaddedArray(getPhaseMatches("OCTAVOS"), 8);
  const pcua = createPaddedArray(getPhaseMatches("CUARTOS"), 4);
  const psem = createPaddedArray(getPhaseMatches("SEMIS"), 2);
  const mfin = getPhaseMatches("FINAL");

  return (
    <div className="flex flex-col relative min-h-screen">
      {savedMsg && (
        <div className="fixed top-20 right-4 z-50 bg-yellow-500 text-black font-black px-4 py-2 rounded-xl text-xs uppercase animate-pulse">
          {savedMsg}
        </div>
      )}

      <div className="overflow-x-auto pb-20 px-4">
        <div className="min-w-[1200px] flex justify-between items-center gap-4 relative">
          {/* LEFT SIDE */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-4 justify-around py-4">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">16vos</h4>
              {p16.slice(0, 8).map((m, i) => <div key={i} className="my-1">{renderMatch(m, "16vos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-16">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Octavos</h4>
              {poct.slice(0, 4).map((m, i) => <div key={i} className="my-6">{renderMatch(m, "octavos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-32">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Cuartos</h4>
              {pcua.slice(0, 2).map((m, i) => <div key={i} className="my-12">{renderMatch(m, "cuartos")}</div>)}
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Semifinal</h4>
              <div className="my-auto">{renderMatch(psem[0], "semis")}</div>
            </div>
          </div>

          {/* CENTER - FINAL */}
          <div className="flex flex-col items-center justify-center gap-12 px-8 min-w-[300px]">
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-2">🏆</span>
              <h3 className="text-xl font-black uppercase font-montserrat text-yellow-500 mb-4 tracking-tighter">Gran Final</h3>
              {renderMatch(mfin[0] || null, "final")}
            </div>
            <div className="flex flex-col items-center mt-12 opacity-80 scale-90">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">3er Puesto</h3>
              {renderMatch(mfin[1] || null, "final")}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex gap-4 flex-row-reverse">
            <div className="flex flex-col gap-4 justify-around py-4">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">16vos</h4>
              {p16.slice(8, 16).map((m, i) => <div key={i} className="my-1">{renderMatch(m, "16vos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-16">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Octavos</h4>
              {poct.slice(4, 8).map((m, i) => <div key={i} className="my-6">{renderMatch(m, "octavos")}</div>)}
            </div>
            <div className="flex flex-col gap-4 justify-around py-32">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Cuartos</h4>
              {pcua.slice(2, 4).map((m, i) => <div key={i} className="my-12">{renderMatch(m, "cuartos")}</div>)}
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-white/30 text-center tracking-widest mb-2">Semifinal</h4>
              <div className="my-auto">{renderMatch(psem[1], "semis")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
