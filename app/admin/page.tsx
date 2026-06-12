import { getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { getLoggedInUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getLoggedInUser();

  // PROTECCIÓN DE RUTA: Solo el usuario 'diego' tiene acceso al panel
  if (!user || user.userId !== 'diego') {
    redirect("/");
  }

  const participants = await getParticipants();
  const matches = await getAllMatches();

  const usersWithStatus = participants.map((p: any) => {
    let missingMatches = 0;
    let missingFinals = 0;

    Object.values(p.predictions).forEach((pred: any) => {
      if (pred.goles_local === null || pred.goles_visitante === null) {
        missingMatches++;
      }
    });

    const finals = p.finals || {};
    if (!finals.campeon) missingFinals++;
    if (!finals.subcampeon) missingFinals++;
    if (!finals.tercer_lugar) missingFinals++;
    if (!finals.cuarto_lugar) missingFinals++;

    return {
      ...p,
      missingMatches,
      missingFinals,
      isComplete: missingMatches === 0 && missingFinals === 0
    };
  });

  usersWithStatus.sort((a, b) => {
    if (a.isComplete === b.isComplete) return a.name.localeCompare(b.name);
    return a.isComplete ? 1 : -1;
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-montserrat">
            ⚙️ Panel de <span className="text-red-500">Administración</span>
          </h2>
          <p className="text-white/40 font-bold uppercase text-xs tracking-[0.2em] mt-2">Control Exclusivo (Diego)</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs transition-colors shadow-lg shadow-yellow-500/20">
            Forzar Sincronización API
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent px-8 py-6 border-b border-white/5">
              <h3 className="text-xl font-black font-montserrat uppercase tracking-tight flex items-center gap-2">
                <span className="text-red-500">⚠️</span> Estado de Predicciones
              </h3>
            </div>
            
            <div className="divide-y divide-white/5">
              {usersWithStatus.map(u => (
                <div key={u.userId} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold text-lg">{u.name}</p>
                    <div className="flex gap-4 mt-2">
                      {u.missingMatches > 0 ? (
                        <span className="text-xs font-black text-red-500 bg-red-500/10 px-2 py-1 rounded uppercase tracking-tighter">
                          Faltan {u.missingMatches} Partidos
                        </span>
                      ) : (
                        <span className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-1 rounded uppercase tracking-tighter">
                          Partidos OK ✓
                        </span>
                      )}
                      
                      {u.missingFinals > 0 ? (
                        <span className="text-xs font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded uppercase tracking-tighter">
                          Faltan {u.missingFinals} Finales
                        </span>
                      ) : (
                        <span className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-1 rounded uppercase tracking-tighter">
                          Finales OK ✓
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    href={`/admin/edit/${u.userId}`} 
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Editar Datos
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black font-montserrat uppercase tracking-tight mb-6 flex items-center gap-2">
              <span className="text-blue-500">🔒</span> Fases del Torneo
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="bg-white/5 border border-green-500/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold uppercase text-sm">Fase de Grupos</p>
                  <p className="text-[10px] text-green-500 font-black uppercase">Activa</p>
                </div>
                <button className="text-xs font-black bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors">Bloquear</button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-50">
                <div>
                  <p className="font-bold uppercase text-sm">Dieciseisavos (16vos)</p>
                  <p className="text-[10px] text-white/40 font-black uppercase">Bloqueada</p>
                </div>
                <button className="text-xs font-black bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors text-white">Habilitar</button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-50">
                <div>
                  <p className="font-bold uppercase text-sm">Octavos de Final</p>
                  <p className="text-[10px] text-white/40 font-black uppercase">Bloqueada</p>
                </div>
                <button className="text-xs font-black bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors text-white">Habilitar</button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-50">
                <div>
                  <p className="font-bold uppercase text-sm">Cuartos de Final</p>
                  <p className="text-[10px] text-white/40 font-black uppercase">Bloqueada</p>
                </div>
                <button className="text-xs font-black bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors text-white">Habilitar</button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-50">
                <div>
                  <p className="font-bold uppercase text-sm">Semifinales</p>
                  <p className="text-[10px] text-white/40 font-black uppercase">Bloqueada</p>
                </div>
                <button className="text-xs font-black bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors text-white">Habilitar</button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between opacity-50">
                <div>
                  <p className="font-bold uppercase text-sm">Gran Final</p>
                  <p className="text-[10px] text-white/40 font-black uppercase">Bloqueada</p>
                </div>
                <button className="text-xs font-black bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors text-white">Habilitar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
