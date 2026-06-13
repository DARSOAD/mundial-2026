// lib/matches.ts

export interface MatchInfo {
  id: string;
  local: string;
  visitante: string;
  date: string;
  time: string;
  group: string;
  order: number;
}

export async function getAllMatches(): Promise<MatchInfo[]> {
  try {
    // Si estamos en el servidor (build time), leemos del FS
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'calendario.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const calendarData = JSON.parse(fileContent);
      return mapCalendarData(calendarData);
    }

    // En el navegador, descargamos el JSON de la carpeta public
    const res = await fetch('/mundial-2026/calendario.json', { cache: 'no-store' });
    const calendarData = await res.json();
    return mapCalendarData(calendarData);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

function mapCalendarData(data: any[]): MatchInfo[] {
  const MATCH_ID_MAP: Record<number, string> = {
    1: "mex_saf", 2: "sko_rch", 3: "can_bih", 4: "usa_par",
    5: "qat_sui", 6: "bra_mar", 7: "hai_esc", 8: "aus1_tur",
    9: "ale_cur", 10: "hol_jap", 11: "cdm_ecu", 12: "sue_tun",
    13: "esp_cve", 14: "bel_egi", 15: "asa_uru", 16: "ira_nze",
    17: "16v_mex_can", 18: "16v_bra_ale"
  };

  return data.map((m: any) => ({
    id: MATCH_ID_MAP[m.match_id] || `match_${m.match_id}`,
    local: m.team_home,
    visitante: m.team_away,
    date: m.date,
    time: m.time_colombia,
    group: m.group,
    order: m.match_id
  })).sort((a, b) => a.order - b.order);
}
