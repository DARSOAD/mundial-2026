import { getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getLoggedInUser } from "@/lib/auth";
import CalendarClient from "./calendar-client";

export default async function CalendarPage() {
  const [participants, matches, user] = await Promise.all([
    getParticipants(),
    getAllMatches(),
    getLoggedInUser()
  ]);

  // Simulación de resultados reales (ya configuramos el engine antes)
  const realResults: Record<string, { home: number, away: number }> = {
    "mex_saf": { home: 2, away: 0 },
    "sko_rch": { home: 2, away: 1 }
  };

  return <CalendarClient participants={participants} matches={matches} results={realResults} currentUser={user} />;
}
