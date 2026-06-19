// lib/data.ts
const BASE = '/mundial-2026';

export async function getResults(): Promise<Record<string, any>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/resultados.json?t=${Date.now()}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function getParticipants(): Promise<any[]> {
  try {
    let raw: any[] = [];
    let knockoutPreds: Record<string, Record<string, any>> = {};

    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
      if (fs.existsSync(filePath)) {
        raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } else {
      const timestamp = Date.now();
      const [resRaw, resKo] = await Promise.all([
        fetch(`${BASE}/predicciones.json?t=${timestamp}`),
        fetch(`${BASE}/predicciones-eliminatorias.json?t=${timestamp}`).catch(() => null)
      ]);
      
      if (resRaw && resRaw.ok) {
        raw = await resRaw.json();
      }

      if (resKo && resKo.ok) {
        const contentType = resKo.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          knockoutPreds = await resKo.json();
        }
      }
    }

    return raw.map((p: any) => {
      const userId = p.participante.toLowerCase().replace(/\s+/g, '_');
      return {
        userId,
        name: p.participante,
        password: p.password || "1234",
        predictions: { ...(p.predicciones_partidos || {}), ...(knockoutPreds[userId] || {}) },
        finals: p.predicciones_finales || {}
      };
    });
  } catch (error) {
    console.error("Error loading participants:", error);
    return [];
  }
}

export async function getSystemSettings(): Promise<{ activePhases: string[] }> {
  try {
    if (typeof window === 'undefined') return { activePhases: ["grupos"] };
    const res = await fetch(`${BASE}/settings.json?t=${Date.now()}`);
    if (!res.ok) return { activePhases: ["grupos"] };
    return await res.json();
  } catch {
    return { activePhases: ["grupos"] };
  }
}

export async function getKnockoutMatches(): Promise<any[]> {
  try {
    if (typeof window === 'undefined') return [];
    const res = await fetch(`${BASE}/eliminatorias.json?t=${Date.now()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getKnockoutPredictions(): Promise<Record<string, Record<string, any>>> {
  try {
    if (typeof window === 'undefined') return {};
    const res = await fetch(`${BASE}/predicciones-eliminatorias.json?t=${Date.now()}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
