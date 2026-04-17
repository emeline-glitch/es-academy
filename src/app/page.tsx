import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileCta } from "@/components/ui/MobileCta";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LeadMagnet } from "@/components/marketing/LeadMagnet";
import { LazyIframe } from "@/components/ui/LazyIframe";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { STATS } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Emeline Siron | Formation investissement immobilier et autonomie financière",
  description:
    "De 0 à 55 locataires en 9 ans. Méthode, outils et communauté pour bâtir ton patrimoine immobilier. 1 900 investisseurs formés. Cashflow, rentabilité, SCI, LMNP.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header activePage="home" />

      {/* Hero — Split dark/photo */}
      <section className="relative bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-es-green-dark via-es-green-dark to-es-green/80" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 min-h-[85vh]">
            {/* Left — content */}
            <div className="flex flex-col justify-center px-6 lg:px-12 py-20 lg:py-28">
              <p className="font-serif italic text-es-gold text-sm sm:text-base mb-6 tracking-wide">
                Mon histoire en une ligne
              </p>
              <h1 className="font-serif font-bold text-white leading-[1.1] mb-6">
                <span className="block text-4xl sm:text-5xl lg:text-6xl">
                  De fille de garagiste à libre à 30 ans.
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-white/80 mt-4 font-normal">
                  L&apos;immobilier l&apos;a fait pour moi. Il peut le faire pour toi.
                </span>
              </h1>
              <p className="text-lg text-white/60 mb-10 max-w-lg leading-relaxed">
                1 541€ nets par mois. C&apos;est la retraite moyenne en France pour une vie entière de travail. J&apos;ai grandi en regardant mes parents travailler jour et nuit. Je me suis promis : plus jamais ça. Depuis 2022, je forme 1 900 personnes à bâtir leur patrimoine par l&apos;immobilier. Méthode, outils, communauté.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <a
                  href="/academy"
                  className="inline-flex items-center justify-center font-semibold rounded-lg px-6 py-4 text-base bg-es-green text-white hover:bg-es-green-light transition-all"
                >
                  Découvrir ES Academy
                </a>
                <a
                  href="/family"
                  className="inline-flex items-center justify-center font-semibold rounded-lg px-6 py-4 text-base bg-es-terracotta text-white hover:bg-es-terracotta-light transition-all"
                >
                  Rejoindre ES Family
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-10 border-t border-white/10 pt-6">
                <div>
                  <div className="text-2xl font-serif font-bold text-es-gold">
                    <AnimatedCounter target={STATS.participants} />
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">participants</div>
                </div>
                <div>
                  <div className="text-2xl font-serif font-bold text-es-gold">
                    <AnimatedCounter target={STATS.satisfaction} suffix="%" />
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">satisfaction</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex text-es-gold">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-white/50 ml-1">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right — photo */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0">
                <Image
                  src="/images/emeline-siron.png"
                  alt="Emeline Siron — Formatrice en investissement immobilier"
                  width={1024}
                  height={1536}
                  className="w-full h-full object-cover object-top"
                  priority
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-es-green-dark via-transparent to-transparent w-1/3" />
              </div>
            </div>

            {/* Photo mobile */}
            <div className="lg:hidden px-6 pb-8 -mt-4">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl max-w-sm mx-auto">
                <Image
                  src="/images/emeline-siron.png"
                  alt="Emeline Siron"
                  width={1024}
                  height={1536}
                  className="w-full h-full object-cover object-top"
                  quality={85}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tu te reconnais ? */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text">
              Tu te reconnais ?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { n: "01", text: "Tu épargnes tous les mois et tu vois ton pouvoir d'achat baisser chaque année." },
              { n: "02", text: "Tu regardes des vidéos YouTube sur l'immobilier depuis 18 mois et tu n'as toujours pas fait ta première offre." },
              { n: "03", text: "Tu as déjà un bien mais tu ne sais pas comment structurer la suite." },
              { n: "04", text: "Tu gagnes bien ta vie et tes économies dorment sur un Livret A à 1,5%." },
            ].map((item) => (
              <div key={item.n} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-serif text-3xl font-bold text-es-terracotta mb-3">{item.n}</p>
                <p className="text-es-text leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-12 text-lg font-bold text-es-text max-w-2xl mx-auto">
            Tu n&apos;es pas seul·e. 1 900 investisseurs étaient exactement là où tu es avant de changer de trajectoire.
          </p>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "1 900+", label: "participants formés" },
            { value: "98%", label: "de satisfaction" },
            { value: "100%", label: "digital" },
            { value: "+30h", label: "de formation" },
          ].map((item, i) => (
            <div key={i}>
              <p className="font-serif text-2xl font-bold text-es-green">{item.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Presse */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-es-text-muted uppercase tracking-widest mb-8">Elles m&apos;ont fait confiance</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-30 grayscale">
            {["BFM Business", "Les Échos", "Capital", "Marie Claire"].map((name) => (
              <span key={name} className="text-xl font-serif font-bold text-es-text">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Ta formatrice — Emeline Siron */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Ta formatrice</span>
              <h2 className="font-serif text-3xl font-bold text-es-text mt-3 mb-4">
                Emeline Siron
              </h2>
              <p className="text-es-text-muted leading-relaxed mb-4">
                Diplômée en immobilier et ancienne Real Estate Asset Manager dans un fonds d&apos;investissements européen, j&apos;ai quitté le salariat pour investir à mon compte.
              </p>
              <p className="text-es-text-muted leading-relaxed mb-4">
                Aujourd&apos;hui, je gère <strong className="text-es-text">55 locataires</strong> et j&apos;accompagne des centaines d&apos;investisseurs à bâtir leur patrimoine immobilier — même en partant de zéro.
              </p>
              <p className="text-es-text-muted leading-relaxed mb-6">
                J&apos;ai grandi dans un garage automobile. Pas de patrimoine familial, pas de réseau, pas de capital de départ. <strong className="text-es-text">Si j&apos;ai pu le faire, toi aussi.</strong>
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { value: "9+ ans", label: "d'expérience" },
                  { value: "55", label: "locataires" },
                  { value: "4.9/5", label: "sur Trustpilot" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-lg px-4 py-2 border border-es-cream-dark">
                    <p className="font-serif font-bold text-es-green text-lg">{stat.value}</p>
                    <p className="text-[10px] text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/emelinesiron/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-es-green/10 flex items-center justify-center hover:bg-es-green/20 transition-colors">
                  <svg className="w-4 h-4 text-es-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/emeline-siron/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-es-green/10 flex items-center justify-center hover:bg-es-green/20 transition-colors">
                  <svg className="w-4 h-4 text-es-green" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.youtube.com/@emelinesiron" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-es-green/10 flex items-center justify-center hover:bg-es-green/20 transition-colors">
                  <svg className="w-4 h-4 text-es-green" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-es-green/5 rounded-2xl p-4">
                <Image
                  src="/images/emeline-siron.png"
                  alt="Emeline Siron — Investisseuse immobilière et formatrice"
                  width={600}
                  height={800}
                  className="rounded-xl object-cover object-top w-full"
                  quality={85}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 espaces */}
      <section id="univers" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mb-3">
              Deux espaces pour avancer
            </h2>
            <p className="text-es-text-muted max-w-xl mx-auto">
              Choisis ton chemin ou combine les deux pour accélérer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ES Academy */}
            <a href="/academy" className="bg-es-green rounded-2xl p-8 lg:p-10 text-white hover:shadow-2xl transition-all hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Formation</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-2">ES Academy</h3>
              <p className="text-white/60 text-sm font-medium mb-4">Forme-toi &amp; passe à l&apos;action</p>
              <p className="text-white/80 mb-6 leading-relaxed">
                {STATS.videoHours}h de formation · {STATS.tools} outils · La méthode complète pour investir en immobilier locatif
              </p>
              <span className="inline-flex items-center gap-2 bg-es-cream text-es-green px-5 py-2.5 rounded-lg font-medium text-sm group-hover:bg-white transition-colors">
                Accéder
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </span>
            </a>

            {/* ES Family */}
            <a href="/family" className="bg-es-terracotta rounded-2xl p-8 lg:p-10 text-white hover:shadow-2xl transition-all hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Communauté</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-2">ES Family</h3>
              <p className="text-white/60 text-sm font-medium mb-4">Rejoins une communauté inspirante</p>
              <p className="text-white/80 mb-6 leading-relaxed">
                Analyses flash, lives exclusifs, opportunités rares · 19€/mois fondateurs
              </p>
              <span className="inline-flex items-center gap-2 bg-es-cream text-es-terracotta px-5 py-2.5 rounded-lg font-medium text-sm group-hover:bg-white transition-colors">
                Rejoindre
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Bandeau stats animés */}
      <section className="bg-es-green py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <div className="text-3xl sm:text-4xl font-serif font-bold">
              <AnimatedCounter target={STATS.participants} suffix="" />
            </div>
            <div className="text-sm text-white/50 mt-1">participants</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-serif font-bold">
              <AnimatedCounter target={STATS.satisfaction} suffix="%" />
            </div>
            <div className="text-sm text-white/50 mt-1">satisfaction</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-serif font-bold">
              <AnimatedCounter target={STATS.videoHours} suffix="h" />
            </div>
            <div className="text-sm text-white/50 mt-1">de formation</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-serif font-bold">
              <AnimatedCounter target={STATS.tools} />
            </div>
            <div className="text-sm text-white/50 mt-1">outils inclus</div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Témoignages</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Ce qu&apos;ils en disent</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sophie L., Lyon",
                initial: "S",
                citation: "La méthode m'a permis d'acheter mon premier appartement en 4 mois. Je recommande à 100%.",
                chiffres: "Lyon · T2 meublé · +180€ cashflow/mois",
                url: null as string | null,
              },
              {
                name: "Thomas R., Rennes",
                initial: "T",
                citation: "Les outils fournis sont incroyables. J'ai enchaîné 3 biens en 18 mois grâce à cette formation.",
                chiffres: "Rennes · 3 biens en SCI · 8,2% de rentabilité",
                url: null as string | null,
              },
              {
                name: "Marie D., Nantes",
                initial: "M",
                citation: "Emeline explique tout simplement. Même sans connaissance, on comprend et on passe à l'action.",
                chiffres: "Nantes · Colocation 4 chambres · 12% de rentabilité",
                url: null as string | null,
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-es-cream-dark border-t-[3px] border-t-es-terracotta card-hover flex flex-col">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-es-green to-es-terracotta flex items-center justify-center mb-4">
                  <span className="font-serif text-2xl font-bold text-white">{t.initial}</span>
                </div>

                {/* Étoiles */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-es-terracotta" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>

                {/* Citation */}
                <p className="font-serif text-lg text-es-text leading-relaxed mb-4 flex-1">&laquo; {t.citation} &raquo;</p>

                {/* Nom */}
                <p className="text-sm font-medium text-es-text mb-2">{t.name}</p>

                {/* Chiffres clés */}
                <p className="text-xs text-es-text-muted">{t.chiffres}</p>

                {/* Lien social optionnel */}
                {t.url && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-es-terracotta hover:text-es-terracotta-dark font-medium">
                    Voir le témoignage →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bridge Solstice Patrimoine */}
      <section className="py-20 bg-es-green-dark text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-serif italic text-es-gold text-sm sm:text-base mb-4 tracking-wide">
            Autre service
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
            Tu as déjà un patrimoine à structurer ?
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Solstice Patrimoine t&apos;accompagne dans la gestion, l&apos;optimisation et la transmission de ton patrimoine existant. Conseil en investissement financier certifié CIF, IAS, IOBSP.
          </p>
          <a
            href="https://solstice-patrimoine.fr"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-6 py-4 text-base bg-white text-es-green-dark hover:bg-es-cream transition-all"
          >
            Découvrir Solstice Patrimoine →
          </a>
        </div>
      </section>

      {/* Lead Magnet */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <LeadMagnet />
          </ScrollReveal>
        </div>
      </section>

      {/* Podcast */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-8">
              <img
                src="/images/logo-otb.png"
                alt="Out of the Box — Podcast Emeline Siron"
                className="h-16 sm:h-20 mx-auto mb-4"
              />
              <p className="text-es-text-muted max-w-xl mx-auto">
                Chaque mardi, un épisode de 30 minutes pour repenser ton rapport à l&apos;argent,
                l&apos;investissement et l&apos;entrepreneuriat.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-es-cream-dark bg-white">
              <LazyIframe
                src="https://player.ausha.co/?showId=k5xV9FYeMPDx&color=%23000000&display=horizontal&multishow=false&playlist=true&dark=false&v=3&playerId=ausha-homepage"
                height={420}
                title="Podcast Out of the Box"
                placeholder="Charger les épisodes du podcast"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA final */}
      <section id="contact" className="relative py-20 lg:py-28 bg-es-green overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark/30 via-transparent to-es-green-light/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
            On y va ?
          </h2>
          <p className="text-white/70 mb-8 text-lg">Faisons avancer tes projets ensemble.</p>
          <Button variant="cta" size="lg" className="btn-gold-shimmer" href="/academy">
            Découvrir la méthode
          </Button>
        </div>
      </section>

      <BottomBanner />
      <Footer />
      <MobileCta />
    </div>
  );
}
