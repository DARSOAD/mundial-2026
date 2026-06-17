// lib/data.ts
const BASE = '/mundial-2026';

export async function getResults(): Promise<Record<string, any>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/resultados.json`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function getParticipants(): Promise<any[]> {
  try {
    let raw: any[] = [];
    let dynamicUsers: Record<string, any> = {};
    let knockoutPreds: Record<string, Record<string, any>> = {};

    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
      if (fs.existsSync(filePath)) {
        raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } else {
      const [resRaw, resDyn, resKo] = await Promise.all([
        fetch(`${BASE}/predicciones.json`),
        fetch(`${BASE}/usuarios.json`),
        fetch(`${BASE}/predicciones-eliminatorias.json`)
      ]);
      
      if (resRaw.ok) raw = await resRaw.json();
      if (resDyn.ok) dynamicUsers = await resDyn.json();
      if (resKo.ok) knockoutPreds = await resKo.json();
    }

    const participants = raw.map((p: any) => {
      const userId = p.participante.toLowerCase().replace(/\s+/g, '_');
      return {
        userId,
        name: p.participante,
        password: p.password || "1234",
        predictions: { ...(p.predicciones_partidos || {}), ...(knockoutPreds[userId] || {}) },
        finals: p.predicciones_finales || {}
      };
    });

    // Add dynamic users
    Object.entries(dynamicUsers).forEach(([userId, u]: [string, any]) => {
      participants.push({
        userId,
        name: u.name,
        password: u.password,
        predictions: { ...(u.predictions || {}), ...(knockoutPreds[userId] || {}) },
        finals: u.finals || {}
      });
    });

    return participants;
  } catch (error) {
    console.error("Error loading participants:", error);
    return [];
  }
}

export async function getSystemSettings(): Promise<{ activePhases: string[] }> {
  try {
    if (typeof window === 'undefined') return { activePhases: ["grupos"] };
    const res = await fetch(`${BASE}/settings.json`);
    if (!res.ok) return { activePhases: ["grupos"] };
    return await res.json();
  } catch {
    return { activePhases: ["grupos"] };
  }
}

export async function getKnockoutMatches(): Promise<any[]> {
  try {
    if (typeof window === 'undefined') return [];
    const res = await fetch(`${BASE}/eliminatorias.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getKnockoutPredictions(): Promise<Record<string, Record<string, any>>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/predicciones-eliminatorias.json`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
