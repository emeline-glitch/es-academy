import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur rentabilité locative 2026 (brut, net, cash-flow) | Emeline Siron",
  description: "Calcule en 2 minutes la rentabilité brute, nette et le cash-flow mensuel de ton bien. Simulateur gratuit par Emeline Siron (55 locataires).",
  path: "/simulateurs/rentabilite-locative",
});

export default function RentabiliteLocativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
