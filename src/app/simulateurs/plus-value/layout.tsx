import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur plus-value immobilière 2026 | Emeline Siron",
  description: "Estime ta plus-value immobilière 2026 : abattements durée de détention, IR, prélèvements sociaux, taxe supplémentaire. Simulateur gratuit, données 2026.",
  path: "/simulateurs/plus-value",
});

export default function PlusValueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
