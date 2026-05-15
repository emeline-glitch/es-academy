import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo/metadata";
import { SolsticeWaitlistForm } from "@/components/marketing/SolsticeWaitlistForm";

export const metadata: Metadata = buildMetadata({
  title: "Solstice Patrimoine arrive bientôt",
  description:
    "Solstice Patrimoine, le cabinet de gestion de patrimoine d'Emeline Siron, ouvre prochainement. Laisse ton email pour être prévenu·e en avant-première.",
  path: "/solstice-bientot",
});

export default function SolsticeBientotPage() {
  return (
    <div className="min-h-screen bg-es-green-dark text-white flex flex-col">
      <Header activePage="home" />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center">
          <p className="font-serif italic text-es-gold text-sm sm:text-base mb-4 tracking-wide">
            Solstice Patrimoine
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Le cabinet ouvre bientôt
          </h1>

          <p className="text-white text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Solstice Patrimoine accompagne les profils qui ont déjà un capital à structurer :
            gestion, optimisation fiscale et transmission. Conseil en investissement financier
            agréé CIF, IAS, IOBSP.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <h2 className="font-serif text-xl font-bold mb-2">
              Être prévenu·e de l&apos;ouverture
            </h2>
            <p className="text-white/80 text-sm mb-6">
              Tu laisses ton email, Antony de mon équipe te recontacte dès que le cabinet ouvre.
            </p>

            <SolsticeWaitlistForm />

            <p className="text-[11px] text-white/50 mt-5 leading-relaxed">
              On n&apos;envoie aucune newsletter. Ton email sert uniquement à te prévenir de l&apos;ouverture.
            </p>
          </div>

          <div className="mt-12">
            <a
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
