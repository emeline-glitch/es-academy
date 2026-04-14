import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/cours", "/admin", "/api", "/connexion", "/inscription"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
