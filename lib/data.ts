// lib/data.ts
const BASE = '/mundial-2026';

export async function getResults(): Promise<Record<string, any>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/resultados.json`, { cache: 'no-store' });
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
      const res = await fetch(`${BASE}/predicciones.json`, { cache: 'no-store' });
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

export async function getSystemSettings() {
  return { activePhases: ["grupos"] };
}
