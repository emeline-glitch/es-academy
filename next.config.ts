import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Optimisation images
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next.js 16 : il faut declarer explicitement les qualites utilisees.
    // Sans, warning runtime "quality X is not configured" pour chaque image
    // qui passe quality={85} ou {90}. Liste alignee sur les usages reels.
    qualities: [75, 85, 90],
    remotePatterns: [
      // Notion attachments (S3 signe, expirent en 1h)
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      // Notion direct (covers, icons hostes par Notion)
      {
        protocol: "https",
        hostname: "**.notion.so",
      },
      // Bunny CDN (videos hosting Family/Academy)
      {
        protocol: "https",
        hostname: "**.b-cdn.net",
      },
      // Unsplash (photos thematiques fallback blog)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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

// Wrapper Sentry : ajoute l'upload des sourcemaps au build (pour des stacks
// traces lisibles dans le dashboard Sentry) + intercepte les server errors.
// Le wrapper est NO-OP si SENTRY_AUTH_TOKEN n'est pas defini : pas de
// breakage au build local, juste pas d'upload sourcemap.
export default withSentryConfig(nextConfig, {
  // Compte Sentry (cree par Emeline) + projet associe.
  // Defini en env vars Vercel (SENTRY_ORG, SENTRY_PROJECT) pour ne pas
  // hardcoder ici. Si absent, l'upload sourcemap est skippe.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silence les warnings de build si pas de token (cas dev / preview deploy)
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload sourcemaps largement (Sentry recommande)
  widenClientFileUpload: true,

  // Tunneling : route les requetes Sentry via /monitoring pour contourner
  // les adblockers qui bloquent *.sentry.io. Bonus pour avoir des metriques
  // realistes (sinon ~10% des erreurs perdues sur les users adblock).
  tunnelRoute: "/monitoring",

  // Bundle size : disabled, on garde le SDK light pour pas alourdir le bundle
  // mobile sur 4G. Si besoin de plus de features, repasser a true.
  disableLogger: true,
});
