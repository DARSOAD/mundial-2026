// lib/matches.ts

export interface MatchInfo {
  id: string;
  local: string;
  visitante: string;
  date: string;
  time: string;
  group: string;
  order: number;
  homeIsPredLocal: boolean;
  calendarHome: string;
  calendarAway: string;
}

export async function getAllMatches(): Promise<MatchInfo[]> {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'calendario.json');
      const calendarData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return mapCalendarData(calendarData);
    }

    const res = await fetch('/mundial-2026/calendario.json');
    if (!res.ok) throw new Error("Failed to fetch calendario.json");
    const calendarData = await res.json();
    return mapCalendarData(calendarData);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

function mapCalendarData(data: any[]): MatchInfo[] {
  return data.map((m: any) => {
    const homeIsLocal = m.home_is_pred_local !== false;
    return {
      id: m.pred_id,
      local: homeIsLocal ? m.team_home : m.team_away,
      visitante: homeIsLocal ? m.team_away : m.team_home,
      date: m.date,
      time: m.time_colombia,
      group: m.group,
      order: m.match_id,
      homeIsPredLocal: homeIsLocal,
      calendarHome: m.team_home,
      calendarAway: m.team_away,
    };
  }).sort((a, b) => a.order - b.order);
}
