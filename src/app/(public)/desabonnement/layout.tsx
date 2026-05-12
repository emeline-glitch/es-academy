import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Désabonnement",
  description: "Gère tes préférences emails ES Academy.",
  path: "/desabonnement",
  noIndex: true,
});

export default function DesabonnementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
