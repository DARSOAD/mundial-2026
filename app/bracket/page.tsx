import { getLoggedInUser } from "@/lib/auth";
import { getAllMatches } from "@/lib/matches";
import { getSystemSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import BracketClient from "./bracket-client";

export default async function BracketPage() {
  const user = await getLoggedInUser();
  
  if (!user) {
    redirect("/login");
  }

  const [allMatches, settings] = await Promise.all([
    getAllMatches(),
    getSystemSettings()
  ]);

  // Filtrar solo partidos de eliminatoria
  const knockoutMatches = allMatches.filter(m => 
    m.group === "16VOS" || 
    m.group === "OCTAVOS" || 
    m.group === "CUARTOS" || 
    m.group === "SEMIS" || 
    m.group === "FINAL"
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase font-montserrat">
          Camino a la <span className="text-yellow-500">Gloria</span>
        </h2>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Llaves de Eliminación Directa</p>
      </div>

      <BracketClient 
        user={user} 
        knockoutMatches={knockoutMatches} 
        activePhases={settings.activePhases || []} 
      />
    </div>
  );
}
