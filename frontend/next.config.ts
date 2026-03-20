import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unique build ID so browsers can detect new deployments
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  headers: async () => [
    {
      // All HTML pages — never cache
      source: "/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ],
    },
    {
      // Static assets (_next/static) — cache aggressively (hashed filenames)
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
