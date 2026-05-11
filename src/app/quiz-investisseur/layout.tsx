import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Quiz : quel investisseur immobilier es-tu ?",
  description: "10 questions pour identifier ton profil et savoir par où commencer dans ton premier investissement locatif. Gratuit, 3 minutes, résultat instantané.",
  path: "/quiz-investisseur",
});

export default function QuizInvestisseurLayout({ children }: { children: React.ReactNode }) {
  return children;
}
