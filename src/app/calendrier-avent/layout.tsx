import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { isSeasonalLeadMagnetActive } from "@/lib/seo/seasonal";

export async function generateMetadata(): Promise<Metadata> {
  const isActive = await isSeasonalLeadMagnetActive("calendrier-avent");
  return buildMetadata({
    title: "Calendrier de l'avent immobilier : 24 jours, 24 conseils",
    description: "Du 1er au 24 decembre : un conseil immobilier par jour pour preparer une annee d'investissement reussie. Inscris-toi pour le recevoir.",
    path: "/calendrier-avent",
    noIndex: !isActive,
  });
}

export default function CalendrierAventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
