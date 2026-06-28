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
    const ids = data.map((m: any) => m.pred_id);

    const elPath = path.join(process.cwd(), 'public', 'eliminatorias.json');
    if (fs.existsSync(elPath)) {
      const elData = JSON.parse(fs.readFileSync(elPath, 'utf8'));
      elData.forEach((m: any) => {
        if (m.id) ids.push(m.id);
      });
    }
    return ids;
  } catch {
    return [];
  }
}
