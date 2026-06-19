"use client";

import { useSearchParams } from "next/navigation";
import EditUserClientPage from "./edit-user-client-page";
import { Suspense } from "react";

function EditPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  return <EditUserClientPage id={id} />;
}

export default function EditUserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-yellow-500 uppercase tracking-widest animate-pulse">Cargando...</div>}>
      <EditPageContent />
    </Suspense>
  );
}
