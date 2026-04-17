"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import heroChantierImg from "../../../public/images/site/01-chantier-action/chantier-07-enceinte-carrelage-signature.jpeg";
import clesImg from "../../../public/images/site/02-patrimoine-cles/patrimoine-01-deux-trousseaux-cles.jpg";
import bebeMicroImg from "../../../public/images/site/05-incarnation-actuelle/incarnation-01-bebe-micro-podcast.jpeg";

type SimulatorCategory = "premier-achat" | "locatif" | "revente";

interface Simulator {
  slug: string;
  title: string;
  desc: string;
  categories: SimulatorCategory[];
  popular: boolean;
  why: string;
  mistake: string;
  example: string;
}

const simulators: Simulator[] = [
  {
    slug: "capacite-emprunt",
    title: "Capacité d'emprunt",
    desc: "Combien peux-tu emprunter ? Calcule ton budget immobilier en fonction de tes revenus et charges.",
    categories: ["premier-achat"],
    popular: true,
    why: "Tu ne peux pas négocier un bien sans connaître ton budget réel. Ton budget réel n'est pas ton salaire, c'est ce que la banque veut bien te prêter.",
    mistake: "Oublier les charges existantes (autres crédits, pension alimentaire). La banque les déduit automatiquement.",
    example: "Salaire 2 500€ net, pas d'autre crédit, taux 3,3% sur 25 ans : tu peux emprunter environ 170 000€.",
  },
  {
    slug: "frais-de-notaire",
    title: "Frais de notaire",
    desc: "Estime les frais de notaire pour ton achat immobilier : ancien, neuf, terrain.",
    categories: ["premier-achat"],
    popular: true,
    why: "Ils représentent 7 à 8% du prix d'achat dans l'ancien. Les ignorer, c'est louper 15 000€ de budget sur un bien à 200 000€.",
    mistake: "Confondre frais de notaire (taxes principalement) et honoraires d'agence. Ce sont deux choses différentes.",
    example: "Bien à 200 000€ dans l'ancien = environ 15 400€ de frais de notaire. Sur un neuf : seulement 4 000 à 6 000€.",
  },
  {
    slug: "rentabilite-locative",
    title: "Rentabilité locative",
    desc: "Calcule le rendement brut, net et le cash-flow de ton investissement locatif.",
    categories: ["locatif"],
    popular: true,
    why: "90% des débutants confondent rentabilité brute et cash-flow. Résultat : ils achètent un bien « rentable » qui leur coûte 200€/mois.",
    mistake: "Ne calculer que le rendement brut (loyer × 12 / prix d'achat). Ça ne dit rien sur la rentabilité réelle après crédit, charges, fiscalité.",
    example: "Bien à 180 000€ à Amiens, loyer 700€/mois. Rentabilité brute : 4,7%. Cash-flow réel après crédit et charges : souvent négatif en LMNP au réel. La vraie rentabilité se calcule nette d'impôts.",
  },
  {
    slug: "mensualite-credit",
    title: "Mensualité de crédit",
    desc: "Calcule ta mensualité en fonction du montant emprunté, du taux et de la durée.",
    categories: ["premier-achat"],
    popular: false,
    why: "La mensualité détermine si un investissement s'autofinance ou te coûte de l'argent chaque mois. C'est la variable qui conditionne ta capacité à enchaîner les acquisitions.",
    mistake: "Oublier l'assurance emprunteur. Elle peut représenter 20 à 40€ par mois supplémentaires.",
    example: "180 000€ empruntés sur 25 ans à 3,3% : mensualité environ 880€ hors assurance, 920€ avec assurance.",
  },
  {
    slug: "taux-endettement",
    title: "Taux d'endettement",
    desc: "Vérifie si tu es dans les clous pour obtenir ton crédit immobilier.",
    categories: ["locatif"],
    popular: false,
    why: "Au-delà de 35%, la banque refuse ton crédit. C'est le seuil imposé par le HCSF depuis 2022.",
    mistake: "Oublier de compter les loyers perçus comme 70% de leur valeur (la banque applique une décote). Tu ne récupères pas 100% du loyer dans ton calcul d'endettement.",
    example: "Salaire 3 000€ + loyer 700€ décoté à 70% = 490€ de revenus locatifs comptés. Total revenus : 3 490€. Mensualité max autorisée : 1 221€ (35%).",
  },
  {
    slug: "plus-value",
    title: "Plus-value immobilière",
    desc: "Estime l'impôt sur la plus-value de ton bien à la revente.",
    categories: ["revente"],
    popular: false,
    why: "En résidence secondaire ou locatif, la plus-value à la revente est fiscalisée. Mal anticipée, elle peut absorber une grosse partie du gain.",
    mistake: "Croire que les 22 ans d'abattement impôt + 30 ans d'abattement prélèvements sociaux se cumulent. Ils se comptent séparément.",
    example: "Achat 150 000€, revente 250 000€ au bout de 10 ans. Plus-value brute 100 000€. Impôt et prélèvements sociaux : environ 32 000€ sans abattement, beaucoup moins après 6 ans de détention.",
  },
  {
    slug: "acheter-ou-louer",
    title: "Acheter ou louer ?",
    desc: "Au bout de combien d'années acheter devient plus rentable que louer ?",
    categories: ["premier-achat"],
    popular: true,
    why: "Louer n'est pas toujours « jeter l'argent par les fenêtres ». Selon la ville et la durée, louer peut être plus rentable qu'acheter.",
    mistake: "Comparer uniquement loyer vs mensualité. Sans intégrer frais de notaire, entretien, taxe foncière et coût d'opportunité du capital.",
    example: "À Paris, louer peut rester plus rentable qu'acheter avant 10 à 12 ans de résidence. À Saint-Étienne, le breakeven est souvent inférieur à 5 ans.",
  },
  {
    slug: "impots-location",
    title: "Impôts sur les loyers",
    desc: "Estime tes impôts sur les revenus locatifs : micro-BIC, réel, LMNP.",
    categories: ["locatif"],
    popular: false,
    why: "Le régime fiscal choisi fait une différence énorme sur ton rendement net. LMNP au réel peut annuler les impôts pendant 10 ans quand le micro-BIC te fait payer dès l'euro.",
    mistake: "Rester au micro-BIC par « simplicité » alors que le régime réel est presque toujours plus avantageux dès qu'il y a un crédit ou des travaux.",
    example: "10 000€ de loyers annuels en LMNP micro-BIC : 5 000€ imposés après abattement 50%. En LMNP réel avec amortissement : souvent 0€ imposé pendant 10 ans.",
  },
];

const filters: { value: "tous" | SimulatorCategory; label: string; countLabel: (n: number) => string }[] = [
  { value: "tous", label: "Tous", countLabel: (n) => `${n} simulateurs` },
  { value: "premier-achat", label: "Je prépare mon premier achat", countLabel: (n) => `${n} simulateurs` },
  { value: "locatif", label: "J'investis en locatif", countLabel: (n) => `${n} simulateurs` },
  { value: "revente", label: "Je revends ou je transmets", countLabel: (n) => `${n} simulateurs` },
];

export default function SimulateursPage() {
  const [activeFilter, setActiveFilter] = useState<"tous" | SimulatorCategory>("tous");

  const filteredSimulators = activeFilter === "tous"
    ? simulators
    : simulators.filter((s) => s.categories.includes(activeFilter));

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      {/* Hero sobre */}
      <section className="py-16 sm:py-20 bg-white border-b border-es-cream-dark">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="font-serif italic text-es-terracotta text-sm sm:text-base mb-4 tracking-wide">
                Les outils que j&apos;utilise moi-même pour mes 12 immeubles
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-es-text mb-6 leading-tight">
                Les 8 simulateurs que j&apos;aurais aimé avoir avant mon premier achat.
              </h1>
              <p className="text-lg text-es-text-muted leading-relaxed">
                Rentabilité, frais de notaire, capacité d&apos;emprunt, fiscalité : les calculs que tu dois maîtriser avant de signer.
                Développés par une investisseuse qui gère <strong className="text-es-green">55 locataires</strong>, pas par un algorithme de banque en ligne.
                <span className="block mt-2 text-sm text-es-text-muted/80">Gratuit, sans inscription.</span>
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <Image
                src={heroChantierImg}
                alt="Emeline en train de poser du carrelage, développeuse des simulateurs sur sa propre méthode"
                width={1200}
                height={900}
                quality={85}
                className="w-full h-auto object-cover"
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Preuve sociale */}
      <section className="py-8 bg-es-cream border-b border-es-cream-dark">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="rounded-xl overflow-hidden shadow-sm shrink-0" style={{ width: 110, height: 110 }}>
              <Image
                src={clesImg}
                alt="Les clés des 12 biens d'Emeline, sur lesquels sa méthode est appliquée"
                width={220}
                height={220}
                quality={85}
                className="w-full h-full object-cover"
                placeholder="blur"
              />
            </div>
            <p className="text-sm text-es-text-muted italic max-w-md">
              Conçus avec la méthode appliquée sur <strong className="text-es-text">55 locataires réels</strong>.
              {/* TODO: rebrancher le compteur "Simulateurs utilisés par X investisseurs cette semaine" [COMPTEUR_CALCULS_SEMAINE] */}
            </p>
          </div>
        </div>
      </section>

      {/* Filtres par objectif */}
      <section className="py-8 bg-white border-b border-es-cream-dark sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          {/* Desktop tabs */}
          <div className="hidden sm:flex flex-wrap gap-2 justify-center">
            {filters.map((f) => {
              const count = f.value === "tous" ? simulators.length : simulators.filter((s) => s.categories.includes(f.value as Exclude<typeof f.value, "tous">)).length;
              const active = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-es-terracotta text-white shadow-sm"
                      : "bg-es-cream text-es-text hover:bg-es-cream-dark"
                  }`}
                >
                  {f.label}
                  <span className={`ml-2 text-xs ${active ? "text-white/70" : "text-es-text-muted"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
          {/* Mobile select */}
          <div className="sm:hidden">
            <label htmlFor="filter-select" className="sr-only">Filtrer les simulateurs</label>
            <select
              id="filter-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
              className="w-full px-4 py-3 rounded-lg border border-es-cream-dark bg-white text-sm font-medium text-es-text"
            >
              {filters.map((f) => {
                const count = f.value === "tous" ? simulators.length : simulators.filter((s) => s.categories.includes(f.value as Exclude<typeof f.value, "tous">)).length;
                return (
                  <option key={f.value} value={f.value}>
                    {f.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </section>

      {/* Grille simulateurs enrichis */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSimulators.map((sim) => (
              <article
                key={sim.slug}
                className="bg-white rounded-2xl border border-es-cream-dark card-hover flex flex-col overflow-hidden group relative"
              >
                {sim.popular && (
                  <span className="absolute top-3 right-3 bg-es-terracotta text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full z-10">
                    Populaire
                  </span>
                )}

                <Link href={`/simulateurs/${sim.slug}`} className="p-6 flex-1 flex flex-col">
                  <h2 className="font-serif text-lg font-bold text-es-text group-hover:text-es-green transition-colors mb-2">
                    {sim.title}
                  </h2>
                  <p className="text-sm text-es-text-muted leading-relaxed mb-4">
                    {sim.desc}
                  </p>

                  {/* Pédagogie */}
                  <div className="space-y-3 text-xs text-es-text-muted mb-4 flex-1">
                    <div>
                      <p className="font-bold text-es-text mb-1">Pourquoi c&apos;est important</p>
                      <p className="leading-relaxed">{sim.why}</p>
                    </div>
                    <div>
                      <p className="font-bold text-es-terracotta mb-1">Erreur fréquente</p>
                      <p className="leading-relaxed">{sim.mistake}</p>
                    </div>
                    <div>
                      <p className="font-bold text-es-green mb-1">Exemple</p>
                      <p className="leading-relaxed italic">{sim.example}</p>
                    </div>
                  </div>

                  <span className="text-sm text-es-green font-medium group-hover:underline mt-auto">
                    Lancer le simulateur →
                  </span>
                </Link>
              </article>
            ))}
          </div>

          {filteredSimulators.length === 0 && (
            <p className="text-center text-es-text-muted mt-12">Aucun simulateur dans cette catégorie pour l&apos;instant.</p>
          )}
        </div>
      </section>

      {/* CTA final — appel découverte */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: "#C4724A" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-es-terracotta-dark/20 via-transparent to-black/10" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center text-white">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={bebeMicroImg}
                alt="Emeline accueillante, prête pour un appel découverte"
                width={1200}
                height={900}
                quality={85}
                className="w-full h-auto object-cover"
                placeholder="blur"
              />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5">
                Tu veux aller plus loin que les calculs ?
              </h2>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Les simulateurs te donnent une photo à un instant T. Mais construire un patrimoine, c&apos;est une stratégie.
                On en discute 30 minutes au téléphone, ensemble, pour voir où tu en es et ce qui te correspond vraiment.
                <strong className="block mt-2">Gratuit, sans engagement.</strong>
              </p>
              <Link
                href="/simulateurs/appel-decouverte"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-base bg-white text-es-terracotta hover:bg-es-cream transition-all shadow-lg"
              >
                Réserver mon appel découverte (30 min, gratuit)
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
