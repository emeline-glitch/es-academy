import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { isSeasonalLeadMagnetActive } from "@/lib/seo/seasonal";

export async function generateMetadata(): Promise<Metadata> {
  const isActive = await isSeasonalLeadMagnetActive("cahier-vacances");
  return buildMetadata({
    title: "Cahier de l'investisseur immobilier : preview gratuite",
    description: "Decouvre le cahier d'exercices d'Emeline Siron pour cadrer ton premier investissement locatif. Preview interactive, gratuite, sans inscription.",
    path: "/cahier-preview",
    noIndex: !isActive,
  });
}

export default function CahierPreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
