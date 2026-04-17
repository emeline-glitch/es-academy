"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";

// TODO: Remplacer par le vrai username Calendly/Cal.com d'Emeline
// Pour Calendly : https://calendly.com/emelinesiron/appel-decouverte
// Pour Cal.com : https://cal.com/emelinesiron/30min
const CALENDLY_BASE_URL = "https://calendly.com/emelinesiron/appel-decouverte";

function CalendlyEmbed() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "simulateur";

  // Construire l'URL avec UTMs pour tracking CRM
  // Calendly intègre ces UTMs dans les événements webhook et questions custom
  const urlWithUtms = `${CALENDLY_BASE_URL}?utm_source=emeline-siron.fr&utm_medium=website&utm_campaign=appel_decouverte_${source}`;

  return (
    <div className="bg-white rounded-2xl border border-es-cream-dark overflow-hidden shadow-sm">
      <iframe
        src={urlWithUtms}
        width="100%"
        height="800"
        title="Réserver un appel découverte avec Emeline Siron"
        className="w-full"
      />
    </div>
  );
}

export default function AppelDecouverte() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-white border-b border-es-cream-dark">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg mx-auto md:mx-0 shrink-0">
              <Image
                src="/images/emeline-siron.png"
                alt="Emeline Siron"
                width={256}
                height={256}
                className="w-full h-full object-cover object-top"
                quality={85}
              />
            </div>
            <div className="text-center md:text-left">
              <p className="font-serif italic text-es-terracotta text-sm mb-2">30 minutes, en visio ou au téléphone</p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mb-3">
                Réserve ton appel découverte avec Emeline
              </h1>
              <p className="text-es-text-muted leading-relaxed">
                On fait le point sur ton projet immobilier. Où tu en es, ce qui te bloque, ce que tu veux atteindre.
                Gratuit, sans engagement. <strong>5 créneaux par semaine seulement.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calendly embed */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Suspense fallback={
            <div className="bg-white rounded-2xl border border-es-cream-dark p-12 text-center">
              <p className="text-gray-400">Chargement du calendrier…</p>
            </div>
          }>
            <CalendlyEmbed />
          </Suspense>
          <p className="text-xs text-es-text-muted text-center mt-4 italic">
            Si le calendrier ne s&apos;affiche pas, <a href={CALENDLY_BASE_URL} target="_blank" rel="noopener noreferrer" className="text-es-terracotta underline">clique ici</a>.
          </p>
        </div>
      </section>

      {/* Ce qu'on va voir */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-es-text text-center mb-10">Ce qu&apos;on va voir ensemble</h2>
          <div className="space-y-6">
            {[
              { num: "01", title: "Ton projet actuel", body: "Où tu en es aujourd'hui. Tes objectifs à 1 an, 3 ans, 10 ans." },
              { num: "02", title: "Tes blocages", body: "Ce qui te freine concrètement : budget, choix stratégiques, fiscalité, confiance." },
              { num: "03", title: "Les prochaines étapes", body: "Les 2-3 actions prioritaires à mettre en place selon ta situation." },
              { num: "04", title: "Ma recommandation", body: "Si tu as besoin de formation (ES Academy), de communauté (ES Family) ou d'accompagnement patrimoine (Solstice)." },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <div className="font-serif text-3xl font-bold text-es-terracotta leading-none shrink-0 w-12">{step.num}</div>
                <div>
                  <h3 className="font-serif font-bold text-es-text mb-1">{step.title}</h3>
                  <p className="text-sm text-es-text-muted leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
