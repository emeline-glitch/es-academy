import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Acheter ou louer en 2026 ? Simulateur | Emeline Siron",
  description: "Acheter ou louer en 2026 ? Simulateur gratuit qui calcule à partir de combien d'années l'achat devient rentable selon ton taux, ton apport et la valorisation.",
  path: "/simulateurs/acheter-ou-louer",
});

export default function AcheterOuLouerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
