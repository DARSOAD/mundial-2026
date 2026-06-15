// lib/static-data.ts
import fs from 'fs';
import path from 'path';

export function getStaticIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.map((p: any) => p.participante.toLowerCase().replace(/\s+/g, '_'));
  } catch {
    return [];
  }
}

export function getStaticMatchIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'calendario.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.map((m: any) => m.pred_id);
  } catch {
    return [];
  }
}
