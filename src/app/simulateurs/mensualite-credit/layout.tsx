import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur mensualité crédit immobilier 2026 | Emeline Siron",
  description: "Calcule ta mensualité de crédit immobilier 2026 : montant, durée, taux, assurance emprunteur. Détail du coût total et des intérêts pour viser l'autofinancement.",
  path: "/simulateurs/mensualite-credit",
});

export default function MensualiteCreditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
