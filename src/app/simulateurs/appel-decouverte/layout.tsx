import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appel découverte gratuit (30 min) | Emeline Siron",
  description: "Réserve 30 minutes avec Emeline pour discuter de ton projet immobilier. Gratuit, sans engagement. 5 créneaux par semaine.",
};

export default function AppelDecouverteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
