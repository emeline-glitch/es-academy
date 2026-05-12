import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Simulateur immobilier locatif",
  description: "Calcule la rentabilité d'un investissement locatif en quelques minutes. Simulateur gratuit Emeline Siron.",
  path: "/simulateur",
});

export default function SimulateurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
