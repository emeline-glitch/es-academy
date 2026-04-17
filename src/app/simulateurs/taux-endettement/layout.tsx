import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur taux d'endettement 2026 (HCSF 35%) | Emeline Siron",
  description: "Calcule ton taux d'endettement immobilier selon les règles HCSF 2026 (35% max). Vérifie si ta banque peut financer ton projet.",
  path: "/simulateurs/taux-endettement",
});

export default function TauxEndettementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
