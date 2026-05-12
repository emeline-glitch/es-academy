import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { SocialProof } from "@/components/ui/SocialProof";
import { SearchModal } from "@/components/ui/SearchModal";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageViewTracker } from "@/components/seo/PageViewTracker";
import { GoogleTagManagerHead, GoogleTagManagerNoScript } from "@/components/seo/GoogleTagManager";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { GtmPageViewTracker } from "@/components/seo/GtmPageViewTracker";
import { EngagementTracker } from "@/components/seo/EngagementTracker";
import { organizationSchema, websiteSchema, personSchema } from "@/lib/seo/schemas";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/utils/constants";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Fallback OG si une page n'override pas son image : OG dynamique cree par
// /api/og avec le titre de marque. Plus robuste qu'un fichier statique qui
// peut disparaitre / etre 404.
const DEFAULT_OG_PARAMS = new URLSearchParams({
  title: "Emeline Siron",
  subtitle: "Investir en immobilier, sans heritage ni reseau",
});
const DEFAULT_OG_URL = `${SITE_URL}/api/og?${DEFAULT_OG_PARAMS.toString()}`;

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} : Formation investissement immobilier`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  keywords: [
    "investissement immobilier",
    "immobilier locatif",
    "formation immobilier",
    "rentabilité immobilière",
    "autofinancement",
    "colocation",
    "LMNP",
    "SCI",
  ],
  authors: [{ name: "Emeline Siron", url: SITE_URL }],
  creator: "Emeline Siron",
  publisher: "Holdem Groupe",
  openGraph: {
    siteName: SITE_NAME,
    locale: "fr_FR",
    type: "website",
    images: [{ url: DEFAULT_OG_URL, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {gtmId && <GoogleTagManagerHead gtmId={gtmId} />}
        {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
      </head>
      <body className="min-h-full flex flex-col">
        {gtmId && <GoogleTagManagerNoScript gtmId={gtmId} />}
        <JsonLd data={[organizationSchema(), websiteSchema(), personSchema()]} />
        {children}
        <PageViewTracker />
        {gtmId && <GtmPageViewTracker />}
        <EngagementTracker />
        <CookieConsent />
        <SocialProof />
        <SearchModal />
      </body>
    </html>
  );
}
