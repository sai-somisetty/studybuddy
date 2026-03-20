import type { NextConfig } from "next";

const NO_CACHE_HEADERS = [
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
  // Unique build ID per deploy — forces new chunk URLs
  generateBuildId: async () => {
    return `v${Date.now()}`;
  },
  headers: async () => [
    // Every page route — no cache
    { source: "/",                  headers: NO_CACHE_HEADERS },
    { source: "/home",              headers: NO_CACHE_HEADERS },
    { source: "/onboarding",        headers: NO_CACHE_HEADERS },
    { source: "/quiz",              headers: NO_CACHE_HEADERS },
    { source: "/lesson",            headers: NO_CACHE_HEADERS },
    { source: "/profile",           headers: NO_CACHE_HEADERS },
    { source: "/progress",          headers: NO_CACHE_HEADERS },
    { source: "/exams",             headers: NO_CACHE_HEADERS },
    { source: "/exams/:path*",      headers: NO_CACHE_HEADERS },
    { source: "/subject/:path*",    headers: NO_CACHE_HEADERS },
    { source: "/chapter/:path*",    headers: NO_CACHE_HEADERS },
    // RSC navigation requests — no cache
    {
      source: "/:path*",
      has: [{ type: "header", key: "rsc" }],
      headers: NO_CACHE_HEADERS,
    },
    // Next.js data fetches — no cache
    {
      source: "/_next/data/:path*",
      headers: NO_CACHE_HEADERS,
    },
  ],
};

export default nextConfig;
