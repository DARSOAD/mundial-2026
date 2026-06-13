import fs from 'fs';
import path from 'path';

// Esta función SOLO se usa durante el comando 'npm run build'
// para generar las rutas estáticas de los archivos [id].
export function getStaticIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'predicciones.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    return data.map((p: any) => p.participante.toLowerCase().replace(/\s+/g, '_'));
  } catch (e) {
    return [];
  }
}

export function getStaticMatchIDs() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'calendario.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const MATCH_ID_MAP: Record<number, string> = {
      1: "mex_saf", 2: "sko_rch", 3: "can_bih", 4: "usa_par",
      5: "qat_sui", 6: "bra_mar", 7: "hai_esc", 8: "aus1_tur",
      9: "ale_cur", 10: "hol_jap", 11: "cdm_ecu", 12: "sue_tun",
      13: "esp_cve", 14: "bel_egi", 15: "asa_uru", 16: "ira_nze",
      17: "16v_mex_can", 18: "16v_bra_ale"
    };

    return data.map((m: any) => MATCH_ID_MAP[m.match_id] || `match_${m.match_id}`);
  } catch (e) {
    return [];
  }
}
