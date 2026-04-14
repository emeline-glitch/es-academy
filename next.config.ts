import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisation images
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.b-cdn.net",
      },
    ],
  },

  // Compression
  compress: true,

  // PoweredBy header disabled
  poweredByHeader: false,

  // Strict mode React
  reactStrictMode: true,

  async headers() {
    return [
      // Sécurité
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Cache statique long pour les assets
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/ressources/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      // Cache pour les pages statiques
      {
        source: "/(academy|family|a-propos|glossaire|podcast|simulateurs)(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      // Cache blog
      {
        source: "/blog(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
