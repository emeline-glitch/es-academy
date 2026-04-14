import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileCta } from "@/components/ui/MobileCta";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LeadMagnet } from "@/components/marketing/LeadMagnet";
import { LazyIframe } from "@/components/ui/LazyIframe";
import { STATS } from "@/lib/utils/constants";

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
                Avec exigence &amp; bienveillance
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                Construisons votre réussite{" "}
                <span className="text-es-gold">financière</span> et{" "}
                <span className="text-es-terracotta-light">humaine</span>
              </h1>
              <p className="text-lg text-white/60 mb-10 max-w-lg leading-relaxed">
                Formation, communauté et accompagnement pour bâtir votre patrimoine immobilier. De zéro à l&apos;indépendance financière.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Button variant="cta" size="lg" className="btn-gold-shimmer font-semibold" href="/academy">
                  Découvrir ES Academy
                </Button>
                <a href="/family" className="inline-flex items-center justify-center font-medium rounded-lg px-6 py-4 text-base border-2 border-es-terracotta/50 text-es-terracotta-light hover:bg-es-terracotta/10 transition-all">
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
                  src="/images/emeline-siron-800.png"
                  alt="Emeline Siron — Formatrice en investissement immobilier"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover object-top"
                  priority
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-es-green-dark via-transparent to-transparent w-1/3" />
              </div>
            </div>

            {/* Photo mobile */}
            <div className="lg:hidden px-6 pb-8 -mt-4">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl max-w-sm mx-auto">
                <Image
                  src="/images/emeline-siron-800.png"
                  alt="Emeline Siron"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover object-top"
                  quality={80}
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
              Choisissez votre chemin ou combinez les deux pour accélérer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ES Academy */}
            <a href="/academy" className="bg-es-green rounded-2xl p-8 lg:p-10 text-white hover:shadow-2xl transition-all hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Formation</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-2">ES Academy</h3>
              <p className="text-white/60 text-sm font-medium mb-4">Formez-vous &amp; passez à l&apos;action</p>
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
              <p className="text-white/60 text-sm font-medium mb-4">Rejoignez une communauté inspirante</p>
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

      {/* Témoignages */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Témoignages</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Ce qu&apos;ils en disent</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sophie L.", text: "La méthode m'a permis d'acheter mon premier appartement en 4 mois. Je recommande à 100%." },
              { name: "Thomas R.", text: "Les outils fournis sont incroyables. J'ai enchaîné 3 biens en 18 mois grâce à cette formation." },
              { name: "Marie D.", text: "Emeline explique tout simplement. Même sans connaissance, on comprend et on passe à l'action." },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-es-cream-dark card-hover">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-es-terracotta" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-es-text-muted leading-relaxed mb-4">&laquo; {t.text} &raquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-es-green/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-es-green">{t.name[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-es-text">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
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
                Chaque mardi, un épisode de 30 minutes pour repenser votre rapport à l&apos;argent,
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
            Prête à passer au niveau supérieur ?
          </h2>
          <p className="text-white/70 mb-8 text-lg">Faisons avancer vos projets ensemble.</p>
          <Button variant="cta" size="lg" className="btn-gold-shimmer" href="/academy">
            Découvrir la méthode
          </Button>
        </div>
      </section>

      <Footer />
      <MobileCta />
    </div>
  );
}
