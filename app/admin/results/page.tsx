"use client";

import { useEffect, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import { getResults } from "@/lib/data";
import { getAllMatches, MatchInfo } from "@/lib/matches";
import { getFlag } from "@/lib/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getLoggedInUser();
      if (!user || user.userId !== "diego") {
        window.location.href = "/mundial-2026/";
        return;
      }
      const [m, r] = await Promise.all([getAllMatches(), getResults()]);
      setMatches(m);
      setResults(r);
      setIsLoading(false);
    }
    load();
  }, []);

  function updateResult(predId: string, field: "homeGoals" | "awayGoals", value: string) {
    const num = value === "" ? null : parseInt(value);
    setResults((prev) => ({
      ...prev,
      [predId]: {
        ...prev[predId],
        [field]: num,
        status: "finished",
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const toSave: Record<string, any> = {};
      Object.entries(results).forEach(([id, r]: [string, any]) => {
        if (r.homeGoals !== null && r.homeGoals !== undefined && r.awayGoals !== null && r.awayGoals !== undefined) {
          toSave[id] = { homeGoals: r.homeGoals, awayGoals: r.awayGoals, status: r.status || "finished" };
        }
      });

      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveResults",
          userId: "diego",
          results: toSave,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Resultados guardados correctamente");
      } else {
        setMessage("Error: " + (data.error || "Unknown"));
      }
    } catch (e: any) {
      setMessage("Error de red: " + e.message);
    }
    setSaving(false);
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-red-500 uppercase tracking-widest animate-pulse">
        Verificando Admin...
      </div>
    );

  // Group matches by date
  const matchesByDate: Record<string, MatchInfo[]> = {};
  matches.forEach((m) => {
    if (!matchesByDate[m.date]) matchesByDate[m.date] = [];
    matchesByDate[m.date].push(m);
  });

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white uppercase font-montserrat">
          Actualizar <span className="text-yellow-500">Resultados</span>
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8 py-3 rounded-2xl text-sm uppercase tracking-wider disabled:opacity-50 transition-all"
        >
          {saving ? "Guardando..." : "Guardar Todo"}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl font-bold text-sm ${message.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {message}
        </div>
      )}

      {Object.entries(matchesByDate).map(([date, dateMatches]) => (
        <div key={date} className="mb-8">
          <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">
            {date}
          </h3>
          <div className="flex flex-col gap-3">
            {dateMatches.map((m) => {
              const r = results[m.id] || {};
              const hasResult = r.homeGoals !== null && r.homeGoals !== undefined && r.awayGoals !== null && r.awayGoals !== undefined;

              // Display values: map between calendar order and prediction order
              const displayHomeGoals = (() => {
                if (!r || r.homeGoals === null || r.homeGoals === undefined) return "";
                return m.homeIsPredLocal ? r.homeGoals : r.awayGoals;
              })();
              const displayAwayGoals = (() => {
                if (!r || r.awayGoals === null || r.awayGoals === undefined) return "";
                return m.homeIsPredLocal ? r.awayGoals : r.homeGoals;
              })();

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasResult ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10"}`}
                >
                  <span className="text-[10px] font-black text-white/30 uppercase w-12">{m.time}</span>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <img src={getFlag(m.calendarHome)} className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="font-bold text-xs text-white uppercase tracking-tight">{m.calendarHome}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-12 h-10 bg-black/40 border border-white/20 rounded-xl text-center text-white font-black text-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      value={displayHomeGoals}
                      onChange={(e) => {
                        const field = m.homeIsPredLocal ? "homeGoals" : "awayGoals";
                        updateResult(m.id, field, e.target.value);
                      }}
                    />
                    <span className="text-white/20 font-black">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-12 h-10 bg-black/40 border border-white/20 rounded-xl text-center text-white font-black text-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      value={displayAwayGoals}
                      onChange={(e) => {
                        const field = m.homeIsPredLocal ? "awayGoals" : "homeGoals";
                        updateResult(m.id, field, e.target.value);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-xs text-white/60 uppercase tracking-tight">{m.calendarAway}</span>
                    <img src={getFlag(m.calendarAway)} className="w-6 h-6 rounded-full border border-white/10" />
                  </div>

                  {hasResult && <span className="text-green-500 text-xs font-black">OK</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
