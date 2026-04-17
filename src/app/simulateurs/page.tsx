"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import bebeMicroImg from "../../../public/images/site/05-incarnation-actuelle/incarnation-01-bebe-micro-podcast.jpeg";

type SimulatorCategory = "premier-achat" | "locatif" | "revente";

interface Simulator {
  slug: string;
  title: string;
  question: string;
  categories: SimulatorCategory[];
  popular: boolean;
}

const simulators: Simulator[] = [
  {
    slug: "capacite-emprunt",
    title: "Capacité d'emprunt",
    question: "Combien la banque va me prêter ?",
    categories: ["premier-achat"],
    popular: true,
  },
  {
    slug: "frais-de-notaire",
    title: "Frais de notaire",
    question: "Combien je vais payer au notaire ?",
    categories: ["premier-achat"],
    popular: true,
  },
  {
    slug: "rentabilite-locative",
    title: "Rentabilité locative",
    question: "Ce bien est-il vraiment rentable ?",
    categories: ["locatif"],
    popular: true,
  },
  {
    slug: "mensualite-credit",
    title: "Mensualité de crédit",
    question: "Combien je vais rembourser chaque mois ?",
    categories: ["premier-achat"],
    popular: false,
  },
  {
    slug: "taux-endettement",
    title: "Taux d'endettement",
    question: "Est-ce que la banque va accepter mon dossier ?",
    categories: ["locatif"],
    popular: false,
  },
  {
    slug: "plus-value",
    title: "Plus-value immobilière",
    question: "Combien d'impôts à la revente de mon bien ?",
    categories: ["revente"],
    popular: false,
  },
  {
    slug: "acheter-ou-louer",
    title: "Acheter ou louer ?",
    question: "Acheter ou continuer à louer : qu'est-ce qui est le plus rentable ?",
    categories: ["premier-achat"],
    popular: true,
  },
  {
    slug: "impots-location",
    title: "Impôts sur les loyers",
    question: "Combien d'impôts je vais payer sur mes loyers ?",
    categories: ["locatif"],
    popular: false,
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
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-serif italic text-es-terracotta text-sm sm:text-base mb-4 tracking-wide">
            Les outils que j&apos;utilise moi-même pour mes 12 immeubles
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-es-text mb-6 leading-tight">
            Les 8 simulateurs que j&apos;aurais aimé avoir avant mon premier achat.
          </h1>
          <p className="text-lg text-es-text-muted leading-relaxed">
            Rentabilité, frais de notaire, capacité d&apos;emprunt, fiscalité : les calculs que tu dois maîtriser avant de signer.
            <span className="block mt-2 text-sm text-es-text-muted/80">Gratuit, sans inscription.</span>
          </p>
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

      {/* Grille simulateurs — cards cliquables avec question directe */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSimulators.map((sim) => (
              <Link
                key={sim.slug}
                href={`/simulateurs/${sim.slug}`}
                className="group bg-white rounded-2xl border border-es-cream-dark p-6 flex flex-col hover:border-es-green hover:shadow-lg transition-all relative cursor-pointer"
              >
                {sim.popular && (
                  <span className="absolute -top-2 right-4 bg-es-terracotta text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full shadow-sm">
                    Populaire
                  </span>
                )}

                {/* Question directe en grand */}
                <p className="font-serif text-xl font-bold text-es-text leading-snug mb-2 group-hover:text-es-green transition-colors">
                  {sim.question}
                </p>

                {/* Mini tag catégorie */}
                <p className="text-xs text-es-text-muted/70 uppercase tracking-wider font-medium mb-4">
                  {sim.title}
                </p>

                {/* CTA gros et visible */}
                <span className="mt-auto inline-flex items-center justify-between gap-2 bg-es-green text-white px-4 py-3 rounded-lg font-semibold text-sm group-hover:bg-es-green-light transition-colors">
                  <span>Lancer le calcul</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
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
