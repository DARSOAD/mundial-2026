"use client";

import { useState } from "react";
import { getResults, getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getDetailedPoints } from "@/lib/scoring";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const [results, participants, matches] = await Promise.all([
        getResults(),
        getParticipants(),
        getAllMatches()
      ]);

      if (participants.length === 0) {
        throw new Error("No hay participantes para heredar puntos");
      }

      // Calculate points for each participant to find the last one
      const processedParticipants = participants.map((p: any) => {
        let totalPoints = 0;
        Object.keys(results).forEach(matchId => {
          const pred = p.predictions[matchId];
          if (pred) {
            const matchData = matches.find(m => m.id === matchId);
            const points = getDetailedPoints(pred, { 
              ...results[matchId], 
              group: matchData?.group,
              local: matchData?.local,
              visitante: matchData?.visitante
            });
            totalPoints += points.totalPoints || 0;
          }
        });
        return { ...p, totalPoints };
      });

      // Sort by points ascending to find the last one
      const sorted = [...processedParticipants].sort((a, b) => a.totalPoints - b.totalPoints);
      const lastUser = sorted[0];

      // Prepare data for Lambda (using original keys)
      // Note: we use lastUser.predictions which includes both group and knockout if merged in getParticipants
      const basePredictions = lastUser.predictions || {};
      const baseFinals = lastUser.finals || {};

      const res = await fetch(`${API_URL}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerUser",
          username,
          password,
          basePredictions,
          baseFinals
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("mundial_user_id", data.userId);
        window.location.href = "/mundial-2026/profile/";
      } else {
        setError(data.error || "Error al registrar");
        setIsLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      setError("Error: " + e.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-black uppercase text-white/50 mb-2 block tracking-wider">
          Nombre de usuario
        </label>
        <input 
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ej: Juan Perez"
          className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-yellow-500 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase text-white/50 mb-2 block tracking-wider">
          Elige una contraseña
        </label>
        <input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-yellow-500 outline-none"
        />
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50 mt-4 shadow-lg shadow-yellow-500/20"
      >
        {isLoading ? "Registrando..." : "Crear mi cuenta"}
      </button>

      <div className="text-center">
        <button 
          type="button"
          onClick={() => window.location.href = "/mundial-2026/login/"}
          className="text-[10px] text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
        >
          Ya tengo cuenta, ingresar
        </button>
      </div>
    </form>
  );
}
