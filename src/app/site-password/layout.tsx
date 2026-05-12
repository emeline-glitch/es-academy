import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Accès protégé",
  description: "Cette page requiert un mot de passe.",
  path: "/site-password",
  noIndex: true,
});

export default function SitePasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
