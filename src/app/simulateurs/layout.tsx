import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "8 simulateurs immobilier gratuits | Emeline Siron",
  description: "Capacité d'emprunt, rentabilité locative, frais de notaire, plus-value, LMNP : les 8 calculs indispensables avant d'investir. Développés par une investisseuse qui gère 55 locataires.",
  path: "/simulateurs",
});

export default function SimulateursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
