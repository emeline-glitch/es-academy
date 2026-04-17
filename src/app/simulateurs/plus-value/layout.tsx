import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur plus-value immobilière 2026 (abattements fiscaux) | Emeline Siron",
  description: "Estime ta plus-value immobilière en 2026 : abattements pour durée de détention, IR, prélèvements sociaux, taxe supplémentaire. Simulateur gratuit par une investisseuse qui gère 55 locataires.",
  path: "/simulateurs/plus-value",
});

export default function PlusValueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
