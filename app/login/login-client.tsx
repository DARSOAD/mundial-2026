"use client";

import { useState } from "react";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginClient({ users }: { users: { userId: string, name: string }[] }) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUser || !password) {
      setError("Selecciona tu nombre y pon tu contraseña");
      return;
    }

    setIsLoading(true);
    const result = await loginUser(selectedUser, password);
    
    if (result.success) {
      window.location.href = "/mundial-2026/profile/";
    } else {
      setError(result.error || "Error al iniciar sesión");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-black uppercase text-white/50 mb-2 block tracking-wider">
          ¿Quién eres?
        </label>
        <select 
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-yellow-500 outline-none appearance-none"
        >
          <option value="">Selecciona tu nombre...</option>
          {users.map(u => (
            <option key={u.userId} value={u.userId}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-black uppercase text-white/50 mb-2 block tracking-wider">
          Contraseña
        </label>
        <input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-yellow-500 outline-none"
        />
        <p className="text-[10px] text-white/30 font-bold uppercase mt-2">La contraseña inicial por defecto es 123</p>
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50 mt-4 shadow-lg shadow-yellow-500/20"
      >
        {isLoading ? "Entrando..." : "Ingresar a mi perfil"}
      </button>

      <div className="text-center">
        <button 
          type="button"
          onClick={() => window.location.href = "/mundial-2026/register/"}
          className="text-[10px] text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
        >
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </div>
    </form>
  );
}
