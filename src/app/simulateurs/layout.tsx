import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "8 simulateurs immobilier gratuits | Emeline Siron",
  description: "Capacité d'emprunt, rentabilité locative, frais de notaire, plus-value, LMNP : les 8 calculs indispensables avant d'investir. Développés par une investisseuse qui gère 55 locataires.",
  path: "/simulateurs",
});

export default function SimulateursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Simulateurs", url: `${SITE_URL}/simulateurs` },
      ])} />
      {children}
    </>
  );
}
