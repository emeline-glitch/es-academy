import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/cours",
          "/cours/",
          "/profil",
          "/profil/",
          "/ressources",
          "/ressources/",
          "/coaching",
          "/connexion",
          "/inscription",
          "/desabonnement",
          "/site-password",
          "/form/",
          "/merci",
          "/merci-outils",
          "/family/bienvenue",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
