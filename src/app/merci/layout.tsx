import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Merci pour ton achat",
  description: "Confirmation de ta commande ES Academy.",
  path: "/merci",
  noIndex: true,
});

export default function MerciLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
