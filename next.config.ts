import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Restarting `next dev` on a saved cache can reload every open page forever:
    // https://github.com/vercel/next.js/issues/100251. Remove once that is fixed.
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [
      {
        // Landing media is large and changes rarely. Files in public/ default to
        // max-age=0, so every landing visit re-downloaded the tour video. Cache
        // for a day in browsers, a week on the CDN; rename a file to bust it.
        source: "/landing/:file*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
