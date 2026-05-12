import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Tes outils gratuits sont prêts",
  description: "Confirmation et accès aux outils gratuits de l'investisseur.",
  path: "/merci-outils",
  noIndex: true,
});

export default function MerciOutilsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
