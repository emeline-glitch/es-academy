import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur capacité d'emprunt 2026 | Emeline Siron",
  description: "Calcule gratuitement ta capacité d'emprunt immobilier 2026 : revenus, charges, taux, durée. Basé sur les règles HCSF (35% d'endettement max), précis et instantané.",
  path: "/simulateurs/capacite-emprunt",
});

export default function CapaciteEmpruntLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
