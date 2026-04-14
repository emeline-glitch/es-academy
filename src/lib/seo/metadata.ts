import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils/constants";

interface MetadataParams {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  publishedTime,
  noIndex = false,
}: MetadataParams): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/images/og-default.jpg`;

  return {
    title,
    description,
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Emeline Siron",
      locale: "fr_FR",
      type: type === "article" ? "article" : "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
