import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur frais de notaire 2026 (ancien, neuf) | Emeline Siron",
  description: "Calcule précisément tes frais de notaire en 2026 : ancien (5,81%), neuf VEFA (0,71%), outre-mer (5,11%). Détail des droits de mutation, émoluments et débours, plus 3 astuces pour les réduire légalement.",
  path: "/simulateurs/frais-de-notaire",
});

export default function FraisNotaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
