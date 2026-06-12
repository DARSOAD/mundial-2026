"use client";

export default function ProfileClient({ user, allMatches }: { user: any, allMatches: any[] }) {
  const preds = user.predictions || {};
  const finals = user.finals || { campeon: "", subcampeon: "", tercer_lugar: "", cuarto_lugar: "" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* SECCIÓN FINALES */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col h-full">
        <h3 className="text-xl font-black uppercase font-montserrat text-yellow-500 mb-2">🏆 Cuadro de Honor</h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-6">Tus elecciones finales (Solo lectura)</p>
        
        <div className="flex flex-col gap-4 flex-1">
          {['campeon', 'subcampeon', 'tercer_lugar', 'cuarto_lugar'].map((pos, i) => (
            <div key={pos}>
              <label className="text-xs font-black uppercase text-white/50 mb-1 block">
                {i+1}º Lugar
              </label>
              <input 
                type="text"
                value={finals[pos] || ""}
                disabled
                className="w-full bg-[#0f1115]/50 border border-white/5 rounded-xl px-4 py-3 font-bold outline-none text-white/50 cursor-not-allowed"
                placeholder="Sin elección"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN PARTIDOS */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#16191f] p-4 rounded-xl -mt-4 z-10 border border-white/5 shadow-lg">
          <div>
            <h3 className="text-xl font-black uppercase font-montserrat text-white">⚽ Mis Predicciones</h3>
            <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest">Historial de Fase de Grupos</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {allMatches.filter(m => m.group !== "16VOS" && m.group !== "OCTAVOS" && m.group !== "CUARTOS" && m.group !== "SEMIS" && m.group !== "FINAL").map(m => {
            const matchPred = preds[m.id];
            
            return (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 opacity-80">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">{m.date} • {m.group}</p>
                    <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Cerrado</span>
                  </div>
                  <p className="font-bold text-sm uppercase text-slate-300">{m.local}</p>
                  <p className="font-bold text-sm uppercase text-slate-300">{m.visitante}</p>
                </div>
                
                <div className="flex flex-col gap-1 items-end ml-4">
                  <div className="w-14 h-8 flex items-center justify-center font-black rounded-lg border bg-transparent border-transparent text-white/80">
                    {matchPred?.goles_local ?? "-"}
                  </div>
                  <div className="w-14 h-8 flex items-center justify-center font-black rounded-lg border bg-transparent border-transparent text-white/80">
                    {matchPred?.goles_visitante ?? "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
