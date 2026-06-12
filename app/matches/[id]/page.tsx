import { getParticipants } from "@/lib/data";
import { getAllMatches } from "@/lib/matches";
import { notFound } from "next/navigation";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const participants = await getParticipants();
  const matches = await getAllMatches();
  const match = matches.find(m => m.id === matchId);

  if (!match) return notFound();

  const realResults: Record<string, { home: number, away: number }> = {
    "mex_saf": { home: 2, away: 0 },
    "sko_rch": { home: 2, away: 1 }
  };
  const result = realResults[matchId];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Cabecera del Partido */}
      <div className="bg-gradient-to-b from-white/10 to-transparent p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/5 mb-12 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-6">
          <div className="md:text-right flex-1 w-full text-center">
            <p className="text-2xl md:text-3xl font-black font-montserrat uppercase">{match.local}</p>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
            <div className="bg-yellow-500 text-black font-black text-3xl md:text-4xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl rotate-3 shadow-lg shadow-yellow-500/20">
              {result ? result.home : "-"}
            </div>
            <span className="text-white/20 font-black tracking-widest text-sm md:text-base">VS</span>
            <div className="bg-white text-black font-black text-3xl md:text-4xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl -rotate-3 shadow-lg">
              {result ? result.away : "-"}
            </div>
          </div>
          <div className="md:text-left flex-1 w-full text-center">
            <p className="text-2xl md:text-3xl font-black font-montserrat uppercase">{match.visitante}</p>
          </div>
        </div>
        {result && (
          <p className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">
            Resultado Oficial Confirmado
          </p>
        )}
      </div>

      {/* Lista de Pronósticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((p) => {
          const pred = p.predictions[matchId];
          const isExact = result && pred && pred.goles_local === result.home && pred.goles_visitante === result.away;
          
          return (
            <div 
              key={p.userId} 
              className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 ${
                isExact 
                ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)] scale-[1.02]' 
                : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${isExact ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40'}`}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black">Pronóstico</p>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-black font-montserrat ${isExact ? 'text-yellow-500' : 'text-slate-100'}`}>
                  {pred?.goles_local ?? '-'} <span className="text-white/20">:</span> {pred?.goles_visitante ?? '-'}
                </div>
                {isExact && (
                  <span className="text-[8px] font-black text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    ¡Acierto Total! 🎯
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
