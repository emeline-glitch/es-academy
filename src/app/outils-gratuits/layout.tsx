import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "10 outils gratuits pour ton premier investissement immobilier",
  description: "Checklist, tracker bancaire, modèles de bail, fichier de négociation : les outils gratuits d'Emeline Siron pour démarrer l'immobilier locatif.",
  path: "/outils-gratuits",
});

export default function OutilsGratuitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Outils gratuits", url: `${SITE_URL}/outils-gratuits` },
      ])} />
      {children}
    </>
  );
}
