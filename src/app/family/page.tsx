import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileCta } from "@/components/ui/MobileCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo/schemas";
import { PRICING } from "@/lib/utils/constants";
import { BottomBanner } from "@/components/marketing/BottomBanner";

export const metadata: Metadata = {
  title: "ES Family — Communauté patrimoniale",
  description: "La communauté patrimoniale pour investisseurs ambitieux. Analyses, lives, opportunités exclusives. 19€/mois fondateurs.",
};

const SKOOL_URL = "https://www.skool.com/es-family";

const faqItems = [
  { question: "Qu'est-ce qu'ES Family exactement ?", answer: "ES Family est une communauté patrimoniale pour investisseurs ambitieux. Vous accédez à des analyses flash, des lives mensuels, des opportunités exclusives et un réseau de membres partageant les mêmes objectifs." },
  { question: "À quelle fréquence le contenu est-il publié ?", answer: "Plusieurs fois par semaine : analyses vidéo flash, un live mensuel avec Emeline et des partenaires experts, un ebook mensuel, et des opportunités en continu." },
  { question: "Comment fonctionne le prix fondateurs ?", answer: "Les 500 premiers membres bénéficient du tarif fondateur à 19€/mois, garanti à vie tant que l'abonnement reste actif. Après les 500 places, le prix passe à 29€/mois." },
  { question: "Puis-je me désabonner à tout moment ?", answer: "Oui, sans engagement. Vous pouvez annuler votre abonnement à tout moment. Si vous êtes fondateur et que vous vous désabonnez, vous perdez le tarif garanti." },
  { question: "Quelle est la différence entre ES Family et ES Academy ?", answer: "ES Academy est une formation complète de 30h pour apprendre à investir. ES Family est une communauté mensuelle pour rester informé, networker et accéder à des opportunités. Les deux se complètent." },
];

export default function FamilyPage() {
  const progressPercent = Math.round(((PRICING.family.placesTotal - PRICING.family.placesRestantes) / PRICING.family.placesTotal) * 100);

  return (
    <div className="min-h-screen">
      <Header activePage="family" />
      <JsonLd data={faqSchema(faqItems)} />

      {/* Hero */}
      <section className="py-20 lg:py-28 bg-es-cream">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-es-terracotta/10 px-5 py-2 text-sm font-medium text-es-terracotta mb-8">
            Communauté patrimoniale
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-es-text leading-tight mb-4">
            ES Family
          </h1>
          <p className="text-xl text-es-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            Rejoignez 500+ investisseurs actifs dans des groupes de discussion thématiques. Analyses flash, lives exclusifs, opportunités rares et entraide au quotidien.
          </p>

          {/* Stats badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-es-text shadow-sm border border-es-green/10">
              <span className="w-2 h-2 rounded-full bg-es-green animate-pulse" />
              500+ membres actifs
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-es-text shadow-sm border border-es-green/10">
              <span className="w-2 h-2 rounded-full bg-es-terracotta" />
              7 groupes thématiques
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-es-text shadow-sm border border-es-green/10">
              <span className="w-2 h-2 rounded-full bg-es-gold" />
              2 lives/mois
            </span>
          </div>

          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-lg bg-es-terracotta text-white hover:bg-es-terracotta-dark transition-all"
          >
            Rejoindre ES Family
          </a>
        </div>
      </section>

      {/* Video placeholder */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          {/* TODO: Replace with Loom embed */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-es-green via-es-green-dark to-es-green-light shadow-lg cursor-pointer group">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-es-green ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <p className="text-white font-medium text-lg">Découvrez ES Family en vidéo — 2 min</p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgence fondateurs */}
      <section className="relative py-14 bg-es-green overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-es-green-dark/30 via-transparent to-es-green-light/10" />
        <div className="relative max-w-lg mx-auto px-6 text-center text-white">
          <h2 className="font-serif text-2xl font-bold mb-2">Offre Fondateurs — Prix garanti à vie</h2>
          <div className="text-5xl font-bold my-4">
            {PRICING.family.priceFondateur}€
            <span className="text-lg font-normal text-white/50">/mois</span>
          </div>
          <p className="text-white/50 text-sm mb-6">
            Après les {PRICING.family.placesTotal} fondateurs → {PRICING.family.priceStandard}€/mois
          </p>
          <div className="bg-white/15 rounded-full h-3 mb-3 overflow-hidden">
            <div className="bg-es-gold h-full rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-sm text-white/60 mb-6">
            {PRICING.family.placesRestantes} places restantes sur {PRICING.family.placesTotal}
          </p>
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-lg bg-es-cream text-es-green hover:bg-white transition-all"
          >
            Rejoindre à {PRICING.family.priceFondateur}€/mois →
          </a>
          <p className="text-xs text-white/30 mt-4">Prix garanti à vie tant que l&apos;abonnement est actif · Sans engagement</p>
        </div>
      </section>

      {/* Ce qui est inclus */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Inclus</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Ce qui vous attend dans ES Family</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRICING.family.features.map((feature, i) => (
              <div key={i} className="bg-es-cream rounded-xl p-6 card-hover">
                <div className="w-10 h-10 rounded-lg bg-es-terracotta/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-es-terracotta" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-sm text-es-text font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 offres */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-es-text">Choisissez votre formule</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Fondateurs */}
            <div className="bg-es-green rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="relative inline-flex items-center bg-es-gold text-white text-xs font-bold px-3 py-1 rounded-full mb-4">FONDATEUR</span>
              <h3 className="font-serif text-2xl font-bold mb-2 relative">Fondateurs</h3>
              <div className="text-4xl font-bold my-4 relative">
                {PRICING.family.priceFondateur}€
                <span className="text-base font-normal text-white/50">/mois TTC</span>
              </div>
              <p className="text-white/50 text-sm mb-6 relative">{PRICING.family.placesTotal} places · Prix garanti à vie</p>
              <ul className="space-y-2 mb-8 relative">
                {PRICING.family.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="text-es-gold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={SKOOL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-full text-center font-semibold rounded-lg px-8 py-4 bg-es-cream text-es-green hover:bg-white transition-all"
              >
                Rejoindre à {PRICING.family.priceFondateur}€/mois
              </a>
            </div>

            {/* Standard grisé */}
            <div className="bg-gray-100 rounded-2xl p-8 opacity-50 cursor-not-allowed relative">
              <span className="inline-flex items-center bg-gray-300 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-4">STANDARD</span>
              <h3 className="font-serif text-2xl font-bold text-gray-400 mb-2">Standard</h3>
              <div className="text-4xl font-bold text-gray-400 my-4">
                {PRICING.family.priceStandard}€
                <span className="text-base font-normal text-gray-300">/mois TTC</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">Après les {PRICING.family.placesTotal} fondateurs</p>
              <ul className="space-y-2 mb-8">
                {PRICING.family.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="w-full bg-gray-200 text-gray-400 text-center py-4 rounded-lg font-medium">
                Bientôt disponible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pont vers Academy */}
      <section className="py-16 bg-es-green/5 border-y border-es-green/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-3">
            Vous voulez apprendre à faire un investissement immobilier rentable ?
          </h2>
          <p className="text-es-text-muted mb-6">
            Rejoignez ES Academy pour maîtriser l&apos;immobilier locatif de A à Z : 30h de formation + 60 outils pour passer à l&apos;action.
          </p>
          <Button variant="primary" size="lg" href="/academy">
            Découvrir ES Academy →
          </Button>
          <p className="text-sm font-bold text-es-terracotta mt-3">ES Family offert 3 mois avec chaque achat de formation</p>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Témoignages</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">La communauté en parle</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Laura M.", text: "Les analyses flash sont top. En 5 minutes je sais si une annonce vaut le coup." },
              { name: "Kevin B.", text: "Le networking avec les autres membres m'a permis de trouver mon associé." },
              { name: "Nadia S.", text: "Les opportunités exclusives sont un vrai plus. Et les lives sont super qualitatifs." },
            ].map((t, i) => (
              <div key={i} className="bg-es-cream rounded-xl p-6 card-hover">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-es-terracotta" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-es-text-muted leading-relaxed mb-4">&laquo; {t.text} &raquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-es-terracotta/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-es-terracotta">{t.name[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-es-text">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">FAQ</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Questions fréquentes</h2>
          </div>
          <Accordion items={faqItems} />
        </div>
      </section>

      <BottomBanner />
      <Footer />
      <MobileCta text="Rejoindre ES Family" href="https://www.skool.com/es-family" variant="terracotta" />
    </div>
  );
}
