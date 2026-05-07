import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { isSeasonalLeadMagnetActive } from "@/lib/seo/seasonal";

export async function generateMetadata(): Promise<Metadata> {
  const isActive = await isSeasonalLeadMagnetActive("chasse-oeufs");
  return buildMetadata({
    title: "Chasse aux oeufs immobilier : 7 indices, 7 jours",
    description: "Pendant la semaine de Paques : 7 quizz pour tester tes connaissances en investissement locatif et gagner des ressources exclusives.",
    path: "/chasse-oeufs",
    noIndex: !isActive,
  });
}

export default function ChasseOeufsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
