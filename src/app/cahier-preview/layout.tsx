import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Cahier de l'investisseur immobilier : preview gratuite",
  description: "Decouvre le cahier d'exercices d'Emeline Siron pour cadrer ton premier investissement locatif. Preview interactive, gratuite, sans inscription.",
  path: "/cahier-preview",
});

export default function CahierPreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
