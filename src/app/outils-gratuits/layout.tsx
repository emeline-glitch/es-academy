import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "10 outils gratuits pour ton premier investissement immobilier",
  description: "Checklist, tracker bancaire, modèles de bail, fichier de négociation : les outils gratuits d'Emeline Siron pour démarrer l'immobilier locatif.",
  path: "/outils-gratuits",
});

export default function OutilsGratuitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
