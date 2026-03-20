import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unique build ID per deploy — forces new chunk URLs
  generateBuildId: async () => {
    return `v${Date.now()}`;
  },
  headers: async () => [
    {
      // HTML pages and RSC payloads — never cache
      source: "/:path((?!_next/static|_next/image|favicon\\.ico).*)",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ],
    },
    {
      // RSC data requests — never cache
      source: "/:path*",
      has: [{ type: "header", key: "rsc" }],
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    },
  ],
};

export default nextConfig;
