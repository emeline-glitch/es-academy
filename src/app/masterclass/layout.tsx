import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Masterclass investissement locatif gratuit",
  description: "Les 5 piliers pour investir dans l'immobilier locatif en partant de zéro. 1h de masterclass offerte par Emeline Siron, 55 lots à son actif.",
  path: "/masterclass",
});

export default function MasterclassLayout({ children }: { children: React.ReactNode }) {
  return children;
}
