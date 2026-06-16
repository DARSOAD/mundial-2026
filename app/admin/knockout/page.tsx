"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getKnockoutMatches, getResults, getSystemSettings } from "@/lib/data";
import { getFlag } from "@/lib/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PHASES = ["16vos", "octavos", "cuartos", "semis", "final"];
const PHASE_LABELS: Record<string, string> = {
  "16vos": "Dieciseisavos", "octavos": "Octavos", "cuartos": "Cuartos",
  "semis": "Semifinales", "final": "Final"
};

export default function AdminKnockoutPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [activePhases, setActivePhases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // New match form
  const [newMatch, setNewMatch] = useState({ phase: "16vos", local: "", visitante: "", date: "", time: "" });

  useEffect(() => {
    async function load() {
      const user = await getLoggedInUser();
      if (!user || user.userId !== "diego") {
        window.location.href = "/mundial-2026/";
        return;
      }
      const [km, r, settings] = await Promise.all([
        getKnockoutMatches(),
        getResults(),
        getSystemSettings()
      ]);
      setMatches(km);
      setResults(r);
      setActivePhases(settings.activePhases || ["grupos"]);
      setIsLoading(false);
    }
    load();
  }, []);

  function generateMatchId(phase: string, index: number) {
    const prefix = phase === "16vos" ? "16v" : phase === "octavos" ? "8v" : phase === "cuartos" ? "4v" : phase === "semis" ? "sf" : "fin";
    return `${prefix}_${index + 1}`;
  }

  async function addMatch() {
    if (!newMatch.local || !newMatch.visitante) {
      setMessage("Error: Selecciona ambos equipos");
      return;
    }
    const phaseMatches = matches.filter(m => m.phase === newMatch.phase);
    const id = generateMatchId(newMatch.phase, phaseMatches.length);
    const match = {
      id,
      phase: newMatch.phase,
      group: newMatch.phase.toUpperCase(),
      local: newMatch.local,
      visitante: newMatch.visitante,
      date: newMatch.date,
      time: newMatch.time
    };

    const updated = [...matches, match];
    setMatches(updated);
    await saveMatches(updated);
    setNewMatch({ phase: newMatch.phase, local: "", visitante: "", date: "", time: "" });
  }

  async function removeMatch(id: string) {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    await saveMatches(updated);
  }

  async function saveMatches(matchList: any[]) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveKnockoutMatches", userId: "diego", matches: matchList })
      });
      const data = await res.json();
      setMessage(data.success ? "Llaves guardadas" : "Error: " + (data.error || "Unknown"));
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setSaving(false);
  }

  async function updateResult(matchId: string, homeGoals: string, awayGoals: string, teamPasses?: string) {
    const result: any = {
      homeGoals: homeGoals === "" ? null : parseInt(homeGoals),
      awayGoals: awayGoals === "" ? null : parseInt(awayGoals),
      status: "finished"
    };
    if (teamPasses) result.teamPasses = teamPasses;

    const newResults = { ...results, [matchId]: result };
    setResults(newResults);

    try {
      await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveResults", userId: "diego", results: { [matchId]: result } })
      });
      setMessage("Resultado guardado");
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  async function togglePhase(phase: string) {
    const newPhases = activePhases.includes(phase)
      ? activePhases.filter(p => p !== phase)
      : [...activePhases, phase];
    setActivePhases(newPhases);

    try {
      await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSettings", userId: "diego", settings: { activePhases: newPhases } })
      });
      setMessage(`Fase ${phase} ${newPhases.includes(phase) ? "activada" : "desactivada"}`);
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">Verificando Admin...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-black text-white uppercase font-montserrat mb-8">
        Gestionar <span className="text-yellow-500">Eliminatorias</span>
      </h2>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl font-bold text-sm ${message.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {message}
        </div>
      )}

      {/* PHASE TOGGLES */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-black text-white uppercase mb-4">Fases Activas (usuarios pueden pronosticar)</h3>
        <div className="flex flex-wrap gap-3">
          {["grupos", ...PHASES].map(phase => (
            <button
              key={phase}
              onClick={() => togglePhase(phase)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                activePhases.includes(phase)
                  ? "bg-yellow-500 text-black"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {PHASE_LABELS[phase] || phase}
            </button>
          ))}
        </div>
      </div>

      {/* ADD MATCH */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-black text-white uppercase mb-4">Agregar Llave</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <select
            value={newMatch.phase}
            onChange={e => setNewMatch({ ...newMatch, phase: e.target.value })}
            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold"
          >
            {PHASES.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
          </select>
          <input
            placeholder="Equipo local"
            value={newMatch.local}
            onChange={e => setNewMatch({ ...newMatch, local: e.target.value })}
            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold"
          />
          <input
            placeholder="Equipo visitante"
            value={newMatch.visitante}
            onChange={e => setNewMatch({ ...newMatch, visitante: e.target.value })}
            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold"
          />
          <input
            type="date"
            value={newMatch.date}
            onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold"
          />
          <input
            placeholder="Hora (ej: 14:00)"
            value={newMatch.time}
            onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
            className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold"
          />
          <button
            onClick={addMatch}
            disabled={saving}
            className="bg-yellow-500 text-black font-black rounded-xl px-4 py-2 text-sm uppercase disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* EXISTING KNOCKOUT MATCHES BY PHASE */}
      {PHASES.map(phase => {
        const phaseMatches = matches.filter(m => m.phase === phase);
        if (phaseMatches.length === 0) return null;

        return (
          <div key={phase} className="mb-8">
            <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">
              {PHASE_LABELS[phase]} ({phaseMatches.length} llaves)
              {activePhases.includes(phase) && <span className="ml-2 text-green-500">ACTIVA</span>}
            </h3>
            <div className="flex flex-col gap-3">
              {phaseMatches.map(m => {
                const r = results[m.id] || {};
                const hasResult = r.homeGoals != null && r.awayGoals != null;
                const isTie = hasResult && r.homeGoals === r.awayGoals;

                return (
                  <div key={m.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${hasResult ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10"}`}>
                    <span className="text-[10px] font-black text-white/30 w-16">{m.id}</span>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <img src={getFlag(m.local)} className="w-6 h-6 rounded-full border border-white/10" />
                      <span className="font-bold text-xs text-white uppercase">{m.local}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="20"
                        className="w-10 h-8 bg-black/40 border border-white/20 rounded-lg text-center text-white font-black text-sm focus:border-yellow-500"
                        value={r.homeGoals ?? ""}
                        onChange={e => updateResult(m.id, e.target.value, String(r.awayGoals ?? ""), r.teamPasses)}
                      />
                      <span className="text-white/20 font-black">-</span>
                      <input
                        type="number" min="0" max="20"
                        className="w-10 h-8 bg-black/40 border border-white/20 rounded-lg text-center text-white font-black text-sm focus:border-yellow-500"
                        value={r.awayGoals ?? ""}
                        onChange={e => updateResult(m.id, String(r.homeGoals ?? ""), e.target.value, r.teamPasses)}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-xs text-white/60 uppercase">{m.visitante}</span>
                      <img src={getFlag(m.visitante)} className="w-6 h-6 rounded-full border border-white/10" />
                    </div>

                    {/* Penalty selector when tie */}
                    {isTie && (
                      <select
                        className="bg-black/40 border border-yellow-500/50 rounded-lg px-2 py-1 text-[10px] font-black text-yellow-500"
                        value={r.teamPasses || ""}
                        onChange={e => updateResult(m.id, String(r.homeGoals), String(r.awayGoals), e.target.value)}
                      >
                        <option value="">Penales?</option>
                        <option value="home">{m.local} pasa</option>
                        <option value="away">{m.visitante} pasa</option>
                      </select>
                    )}

                    <button
                      onClick={() => removeMatch(m.id)}
                      className="text-red-500/50 hover:text-red-500 text-xs font-black"
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
