import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { SocialProof } from "@/components/ui/SocialProof";
import { SearchModal } from "@/components/ui/SearchModal";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageViewTracker } from "@/components/seo/PageViewTracker";
import { GoogleTagManagerHead, GoogleTagManagerNoScript } from "@/components/seo/GoogleTagManager";
import { GtmPageViewTracker } from "@/components/seo/GtmPageViewTracker";
import { organizationSchema } from "@/lib/seo/schemas";
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

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} : Formation investissement immobilier`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    siteName: SITE_NAME,
    locale: "fr_FR",
    type: "website",
    images: [{ url: `${SITE_URL}/images/og-default.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
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
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {gtmId && <GoogleTagManagerHead gtmId={gtmId} />}
      </head>
      <body className="min-h-full flex flex-col">
        {gtmId && <GoogleTagManagerNoScript gtmId={gtmId} />}
        <JsonLd data={organizationSchema()} />
        {children}
        <PageViewTracker />
        {gtmId && <GtmPageViewTracker />}
        <CookieConsent />
        <SocialProof />
        <SearchModal />
      </body>
    </html>
  );
}
