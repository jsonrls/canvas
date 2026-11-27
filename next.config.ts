import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Restarting `next dev` on a saved cache can reload every open page forever:
    // https://github.com/vercel/next.js/issues/100251. Remove once that is fixed.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
