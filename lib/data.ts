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
    let raw: any[];
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
      raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      const res = await fetch(`${BASE}/predicciones.json`);
      if (!res.ok) return [];
      raw = await res.json();
    }

    return raw.map((p: any) => ({
      userId: p.participante.toLowerCase().replace(/\s+/g, '_'),
      name: p.participante,
      password: p.password || "1234",
      predictions: p.predicciones_partidos || {},
      finals: p.predicciones_finales || {}
    }));
  } catch {
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
