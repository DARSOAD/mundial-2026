// lib/data.ts

const SNAPSHOT_URL = '/mundial-2026/data_snapshot.json';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getSnapshotData() {
  try {
    if (typeof window === 'undefined') {
      return { participants: [], settings: { activePhases: ["grupos"] } };
    }
    const res = await fetch(SNAPSHOT_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error("No se pudo cargar el snapshot");
    return await res.json();
  } catch (error) {
    console.error("Error snapshot:", error);
    return { participants: [], settings: { activePhases: ["grupos"] } };
  }
}

// Para el Admin/Profile que necesitan la versión más fresca de la DB
export async function getFreshData() {
  try {
    if (!API_URL) return await getSnapshotData();
    
    const res = await fetch(`${API_URL}/manage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getAllData' }) // Necesitaremos agregar esta acción a la Lambda
    });
    return await res.json();
  } catch (error) {
    return await getSnapshotData();
  }
}

export async function getParticipants() {
  const data = await getSnapshotData();
  return data.participants || [];
}

export async function getSystemSettings() {
  const data = await getSnapshotData();
  return data.settings || { activePhases: ["grupos"] };
}
