"use client";

import { logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="hover:text-red-500 transition-colors uppercase"
    >
      Salir
    </button>
  );
}
