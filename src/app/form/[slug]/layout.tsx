import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Formulaire ES Academy",
  description: "Réponds en quelques minutes à ce formulaire ES Academy.",
  noIndex: true,
});

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
