import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mundial-2026',
  images: {
    unoptimized: true, // Requerido para exportación estática
  },
  // Deshabilitar features que requieren un servidor Node.js
  trailingSlash: true,
};

export default nextConfig;
