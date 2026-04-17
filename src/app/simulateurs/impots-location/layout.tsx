import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur impôts revenus locatifs LMNP 2026 | Emeline Siron",
  description: "Estime tes impôts sur tes loyers en LMNP, micro-BIC ou régime réel, location nue ou meublée. Simulateur gratuit par une investisseuse qui gère 55 locataires.",
  path: "/simulateurs/impots-location",
});

export default function ImpotsLocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
