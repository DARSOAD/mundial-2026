import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-montserrat" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Mundial 2026 - Polla Familiar 🇨🇴",
  description: "La polla futbolera de la familia para el Mundial 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable} dark`}>
      <body className="bg-[#0f1115] text-slate-100 antialiased selection:bg-yellow-500/30">
        {/* Fondo con toque colombiano */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-yellow-600/10 blur-[64px] rounded-full" />
          <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-blue-600/10 blur-[64px] rounded-full" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-red-600/10 blur-[64px] rounded-full" />
        </div>
        
        <Navbar />

        <main className="relative z-10 font-inter">
          {children}
        </main>
      </body>
    </html>
  );
}
