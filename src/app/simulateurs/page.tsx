import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Simulateurs immobilier gratuits — Calculez votre projet",
  description: "8 simulateurs gratuits : capacité d'emprunt, frais de notaire, rentabilité locative, mensualité crédit, plus-value, taux d'endettement et plus.",
  path: "/simulateurs",
});

const simulators = [
  {
    slug: "capacite-emprunt",
    title: "Capacité d'emprunt",
    desc: "Combien pouvez-vous emprunter ? Calculez votre budget immobilier en fonction de vos revenus et charges.",
    icon: "🏦",
    popular: true,
  },
  {
    slug: "frais-de-notaire",
    title: "Frais de notaire",
    desc: "Estimez les frais de notaire pour votre achat immobilier : ancien, neuf, terrain.",
    icon: "📋",
    popular: true,
  },
  {
    slug: "rentabilite-locative",
    title: "Rentabilité locative",
    desc: "Calculez le rendement brut, net et le cash-flow de votre investissement locatif.",
    icon: "📊",
    popular: true,
  },
  {
    slug: "mensualite-credit",
    title: "Mensualité de crédit",
    desc: "Calculez votre mensualité en fonction du montant emprunté, du taux et de la durée.",
    icon: "💳",
    popular: false,
  },
  {
    slug: "taux-endettement",
    title: "Taux d'endettement",
    desc: "Vérifiez si vous êtes dans les clous des 35% pour obtenir votre crédit immobilier.",
    icon: "📐",
    popular: false,
  },
  {
    slug: "plus-value",
    title: "Plus-value immobilière",
    desc: "Estimez l'impôt sur la plus-value lors de la revente de votre bien.",
    icon: "💰",
    popular: false,
  },
  {
    slug: "acheter-ou-louer",
    title: "Acheter ou louer ?",
    desc: "Au bout de combien d'années acheter devient plus rentable que louer ?",
    icon: "🤔",
    popular: true,
  },
  {
    slug: "impots-location",
    title: "Impôts sur les loyers",
    desc: "Estimez vos impôts sur les revenus locatifs : micro-BIC, réel, LMNP.",
    icon: "🧮",
    popular: false,
  },
];

export default function SimulateursPage() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      {/* Hero */}
      <section className="bg-es-green py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Outils gratuits</span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
            Simulateurs immobilier
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            8 outils de calcul gratuits pour préparer et optimiser votre investissement immobilier.
          </p>
        </div>
      </section>

      {/* Simulators grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulators.map((sim, i) => (
              <ScrollReveal key={sim.slug} delay={i * 80}>
                <Link
                  href={`/simulateurs/${sim.slug}`}
                  className="block bg-white rounded-2xl p-6 border border-es-cream-dark card-hover group relative h-full"
                >
                  {sim.popular && (
                    <span className="absolute top-3 right-3 bg-es-terracotta text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                      Populaire
                    </span>
                  )}
                  <span className="text-3xl mb-3 block">{sim.icon}</span>
                  <h2 className="font-serif text-lg font-bold text-es-text group-hover:text-es-green transition-colors mb-2">
                    {sim.title}
                  </h2>
                  <p className="text-sm text-es-text-muted leading-relaxed mb-4">
                    {sim.desc}
                  </p>
                  <span className="text-sm text-es-green font-medium group-hover:underline">
                    Calculer →
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-es-green text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-white mb-4">
            Les simulateurs ne suffisent pas ?
          </h2>
          <p className="text-white/70 mb-8">
            La Méthode Emeline Siron vous apprend à analyser, financer et gérer vos investissements de A à Z.
          </p>
          <Button variant="cta" size="lg" className="btn-gold-shimmer" href="/academy">
            Découvrir la formation complète →
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
