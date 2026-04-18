import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { TestimonialsGrid } from "@/components/marketing/TestimonialsGrid";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { MobileCta } from "@/components/ui/MobileCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseSchema, faqSchema } from "@/lib/seo/schemas";
import { STATS, PRICING, MODULES_PROGRAMME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "ES Academy — La Méthode Emeline Siron",
  description: "Apprends la meilleure stratégie pour te lancer dans l'immobilier locatif, générer des revenus et bâtir ton patrimoine.",
};

const faqItems = [
  { question: "Que se passe-t-il après l'inscription ?", answer: "Tu reçois immédiatement tes identifiants par email. Tu accèdes à l'intégralité de la formation, des outils et de la communauté ES Family pendant 3 mois." },
  { question: "Combien de temps ai-je accès au contenu ?", answer: "Si tu termines la formation en 3 mois, tu gardes un accès illimité. Les mises à jour et replays sont inclus à vie." },
  { question: "Comment fonctionne le coaching sur mesure ?", answer: "Le coaching est un accompagnement individualisé adapté à ton profil et tes objectifs. Contacte-nous pour un devis personnalisé." },
  { question: "Les sessions collectives sont-elles enregistrées ?", answer: "Oui, toutes les sessions de mentorat collectives sont enregistrées et disponibles en replay dans ton espace." },
  { question: "Quelle est la politique de remboursement ?", answer: "Tu disposes de 14 jours pour tester la formation. Si elle ne te convient pas, envoie un email et tu es remboursé(e) intégralement." },
];

const videoTestimonials = [
  { name: "Stéphanie V.", quote: "De salariée à 12 lots en 18 mois", color: "from-es-green-dark to-es-green" },
  { name: "Nicolas B.", quote: "Mon premier immeuble grâce à la méthode", color: "from-es-terracotta/80 to-es-terracotta" },
  { name: "Audrey M.", quote: "J'ai quitté mon CDI grâce aux revenus locatifs", color: "from-es-green to-es-green-light" },
];

export default function AcademyPage() {
  return (
    <div className="min-h-screen">
      <Header activePage="academy" />
      <JsonLd data={[courseSchema(), faqSchema(faqItems)]} />

      {/* 1. Hero — Style B Dark */}
      <section className="relative py-24 lg:py-32 bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-es-gold/30 bg-es-gold/10 px-5 py-2 text-sm font-medium uppercase tracking-widest text-es-gold mb-8">
            <span className="h-2 w-2 rounded-full bg-es-gold animate-pulse" />
            Formation immobilier
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            La Méthode <span className="text-es-gold">Emeline Siron</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Apprends la meilleure stratégie pour te lancer dans l&apos;immobilier locatif, générer des revenus et bâtir ton patrimoine
          </p>
          <Button variant="cta" size="lg" className="btn-gold-shimmer font-semibold" href="#offre">
            Rejoindre le programme — {PRICING.academy.priceDisplay}€
          </Button>
          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-8">
            {[
              { value: `${STATS.participants.toLocaleString("fr-FR")}`, label: "participants" },
              { value: `${STATS.satisfaction}%`, label: "satisfaction" },
              { value: `${STATS.videoHours}h`, label: "de formation" },
              { value: `${STATS.tools}`, label: "outils inclus" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-es-gold">{s.value}</div>
                <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Vidéo d'introduction */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Présentation</span>
              <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Découvrez la méthode en 3 minutes</h2>
            </div>
            <div className="aspect-video bg-es-green-dark rounded-2xl overflow-hidden flex items-center justify-center relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/30" />
              <div className="relative text-center text-white">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-sm text-white/60">Vidéo de présentation</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comment ça marche — 3 étapes */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Processus</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Comment ça marche ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Inscris-toi", desc: "Paiement sécurisé et accès immédiat à la plateforme, aux 14 modules et aux 60 outils.", icon: "🔑" },
              { step: "02", title: "Suis la méthode", desc: "Avance à ton rythme. Chaque module se termine par un quiz pour valider tes acquis.", icon: "🎯" },
              { step: "03", title: "Passe à l'action", desc: "Utilise les outils et le coaching pour réaliser ton premier investissement.", icon: "🚀" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-es-green/10 flex items-center justify-center text-3xl">
                    {item.icon}
                  </div>
                  <span className="text-xs text-es-terracotta font-bold">{item.step}</span>
                  <h3 className="font-serif text-lg font-bold text-es-text mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-es-text-muted leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Pour qui */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Pour qui ?</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Cette formation est faite pour toi si...</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              "Tu veux investir mais tu ne sais pas par où commencer",
              "Tu as peur de faire une mauvaise affaire",
              "Tu penses qu'il faut un gros apport pour démarrer",
              "Tu veux générer des revenus complémentaires",
              "Tu cherches une méthode éprouvée, pas des théories",
              "Tu veux être accompagné(e) par quelqu'un qui l'a fait",
            ].map((item, i) => (
              <div key={i} className="group bg-es-cream rounded-2xl p-6 hover:bg-es-green transition-all duration-300 cursor-default border border-transparent hover:border-es-green-dark">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-es-green group-hover:text-es-gold mt-0.5 shrink-0 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm text-es-text group-hover:text-white font-medium transition-colors">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Avant / Après */}
      <section className="relative py-20 bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-white">Ta transformation commence ici</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Avant */}
            <div className="bg-es-cream rounded-2xl p-8 border border-es-cream-dark">
              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-es-green-dark/60 font-medium">Avant</span>
                <h3 className="font-serif text-xl font-bold text-es-green-dark mt-2">Les fausses croyances</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "\"Il n'existe aucune ville rentable\"",
                  "\"Les banques ne financent pas sans apport\"",
                  "\"Faire des travaux, c'est trop risqué\"",
                  "\"Le cash-flow immobilier, c'est un mythe\"",
                  "\"Investir seul, c'est impossible\"",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-es-green-dark text-base line-through decoration-red-500 decoration-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Après */}
            <div className="bg-es-cream rounded-2xl p-8 border border-es-cream-dark">
              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-es-gold-dark font-medium">Après la formation</span>
                <h3 className="font-serif text-xl font-bold text-es-green-dark mt-2">Ta nouvelle réalité</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Tu maîtrises ton marché et tu sais repérer les bonnes affaires",
                  "Tu gères un patrimoine solide qui travaille pour toi",
                  "Tu enchaînes les opérations avec confiance",
                  "Tu vis de tes revenus locatifs",
                  "Tu es un investisseur autonome et rentable",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-es-green-dark font-medium text-base">
                    <svg className="w-5 h-5 text-es-green mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Programme */}
      <section id="programme" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Programme</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3 mb-3">{STATS.modules} modules complets</h2>
            <p className="text-es-text-muted">De débutant à investisseur confirmé</p>
          </div>
          <div className="space-y-3">
            {MODULES_PROGRAMME.map((mod) => (
              <Accordion
                key={mod.number}
                items={[{
                  question: `Module ${mod.number} — ${mod.title}`,
                  answer: mod.items.join(" · "),
                }]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Offre et prix */}
      <section id="offre" className="relative py-12 sm:py-20 lg:py-28 bg-es-green overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark/30 via-transparent to-es-green-light/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative max-w-[1200px] mx-auto px-6 text-es-cream">
          <ScrollReveal>
            {/* 1. Header centré */}
            <div className="text-center mb-10 lg:mb-14">
              <span className="text-xs uppercase tracking-[0.25em] text-es-terracotta-light font-medium">Offre complète</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-es-cream">La Méthode Emeline Siron</h2>
              <p className="font-serif text-xl sm:text-2xl text-es-gold mt-3">+ 3 mois ES Family offerts</p>
            </div>

            {/* 2. Bloc prix */}
            <div className="text-center mb-12 lg:mb-16">
              <p className="text-sm text-es-cream/40 mb-2">
                Valeur totale <span className="line-through">1 085€</span>
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl sm:text-7xl lg:text-8xl font-bold text-es-cream">998€</span>
                <span className="text-lg font-normal text-es-cream/50">TTC</span>
              </div>
              <p className="text-base text-es-cream/70 mt-3">Paiement en 1x, 3x ou 10x sans frais</p>
              <p className="text-sm text-es-terracotta-light mt-4 font-medium">Déjà plus de 1 800 investisseurs formés</p>
            </div>
          </ScrollReveal>

          {/* 3. Grille 2 colonnes */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-6 lg:gap-12 mb-12 lg:mb-16">
            {/* Colonne gauche — La formation */}
            <ScrollReveal delay={100}>
              <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
                  <span className="text-3xl" aria-hidden>🎓</span>
                  <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-es-cream">La formation</h3>
                </div>
                <ul className="space-y-5">
                  {[
                    { strong: "30h de formation vidéo structurée", rest: ", du zéro aux stratégies avancées (LMNP, colocation, immeuble de rapport, SCI, fiscalité)" },
                    { strong: "60+ outils prêts à l'emploi", rest: " : calculateurs, modèles de négociation, checklists visites, trames de baux, grilles d'analyse" },
                    { strong: "Examen final certifiant", rest: " : repars avec ta certification Méthode ES" },
                    { strong: "Accès à vie + mises à jour incluses", rest: " : le marché bouge, ta formation aussi" },
                    { strong: "Option Coaching sur mesure", rest: " : un expert dédié t'accompagne à chaque étape, calibré selon ton profil et ton projet (sur devis, activable à tout moment)" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-es-green-light mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-es-cream/90 text-[15px] leading-relaxed">
                        <strong className="text-es-cream font-semibold">{item.strong}</strong>
                        {item.rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Colonne droite — ES Family (offert 3 mois) */}
            <ScrollReveal delay={200}>
              <div className="h-full bg-es-terracotta/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-es-terracotta/40 relative">
                <div className="flex items-center justify-between gap-3 mb-4 pb-5 border-b border-es-terracotta/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0" aria-hidden>🔑</span>
                    <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-es-cream truncate">+ 3 mois ES Family offerts</h3>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold bg-es-terracotta text-es-cream px-2.5 py-1 rounded-full">valeur 87€</span>
                </div>

                <p className="italic text-es-cream/80 text-[15px] leading-relaxed mb-6">
                  ES Family, c'est la communauté privée qui fait passer la théorie à l'action.
                </p>

                <ul className="space-y-5">
                  {[
                    { strong: "Lives mensuels avec Emeline et ses partenaires", rest: " + replays illimités (décryptage d'opportunités, Q&A, études de cas réels)" },
                    { strong: "4 simulateurs professionnels intégrés", rest: " : frais de notaire, rendement locatif, cashflow mensuel, capacité d'emprunt" },
                    { strong: "34 fichiers, classement de villes et simulateurs", rest: " pour appliquer immédiatement" },
                    { strong: "Les bons plans de Sorel", rest: " : promos exclusives sur matériaux et travaux, négociées pour la communauté" },
                    { strong: "Partenaires privilégiés", rest: " : codes promo et avantages exclusifs auprès de 6 partenaires immobiliers triés sur le volet" },
                    { strong: "Annuaire des membres et networking", rest: "" },
                    { strong: "Quiz quotidien", rest: " : 91 questions sur 5 domaines pour ancrer tes connaissances" },
                    { strong: "Discussions thématiques", rest: " : 2 piliers (Immobilier et Patrimoine) avec sous-groupes actifs" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-es-terracotta-light mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-es-cream/90 text-[15px] leading-relaxed">
                        <strong className="text-es-cream font-semibold">{item.strong}</strong>
                        {item.rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* 4. CTA final centré */}
          <ScrollReveal delay={300}>
            <div className="max-w-2xl mx-auto text-center">
              <Button variant="cta" size="lg" className="w-full sm:w-auto sm:px-12 font-semibold text-base">
                Je rejoins la formation →
              </Button>
              <p className="text-sm text-es-cream/70 mt-4">
                Paiement sécurisé · Accès immédiat · Satisfait ou remboursé 14 jours
              </p>
              <p className="text-[11px] text-es-cream/40 mt-6 max-w-xl mx-auto leading-relaxed">
                À l'issue des 3 mois, l'accès ES Family se poursuit automatiquement à 29€/mois, sans engagement, annulable en 1 clic.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Coaching sur-mesure (après l'offre) */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-es-green rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-serif text-2xl font-bold mb-2 relative">{PRICING.coaching.name}</h3>
            <p className="text-white/70 mb-6 relative">{PRICING.coaching.description}</p>
            <Button variant="cta" className="btn-gold-shimmer relative">Demander un devis →</Button>
          </div>
        </div>
      </section>

      {/* Messages WhatsApp d'élèves */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Ils ont signé</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Les messages que je reçois</h2>
          </div>
          <TestimonialsGrid
            variant="masonry"
            items={[
              { src: "/images/site/04-avis-clients/IMG_5768.jpg", alt: "Message d'élève Evermind", width: 1008, height: 819 },
              { src: "/images/site/04-avis-clients/IMG_5767.jpg", alt: "Message d'élève Evermind", width: 958, height: 1689 },
              { src: "/images/site/04-avis-clients/IMG_5766.jpg", alt: "Message d'élève Evermind", width: 1030, height: 1744 },
              { src: "/images/site/04-avis-clients/IMG_5765.jpg", alt: "Message d'élève Evermind", width: 996, height: 1381 },
              { src: "/images/site/04-avis-clients/IMG_5764.jpg", alt: "Message d'élève Evermind", width: 1014, height: 573 },
              { src: "/images/site/04-avis-clients/IMG_5763.jpg", alt: "Message d'élève Evermind", width: 1179, height: 454 },
              { src: "/images/site/04-avis-clients/IMG_5762.jpg", alt: "Message d'élève Evermind", width: 1178, height: 1415 },
              { src: "/images/site/04-avis-clients/IMG_5761.jpg", alt: "Message d'élève Evermind", width: 1024, height: 1010 },
              { src: "/images/site/04-avis-clients/IMG_5759.jpg", alt: "Message d'élève Evermind", width: 1179, height: 711 },
            ]}
          />
        </div>
      </section>

      {/* Avis vidéo */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Témoignages vidéo</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Ils témoignent en vidéo</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTestimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="group cursor-pointer">
                  <div className={`aspect-video rounded-2xl overflow-hidden relative bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                    <div className="absolute inset-0 opacity-[0.05]" style={{
                      backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                      backgroundSize: "24px 24px",
                    }} />
                    <div className="relative w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium text-es-text text-sm">{t.name}</p>
                    <p className="text-es-text-muted text-sm mt-1">&laquo; {t.quote} &raquo;</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Avis texte */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Avis vérifiés</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3 mb-3">Ils ont suivi la méthode</h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-es-text-muted">
              <span>★ {STATS.trustpilotScore} Trustpilot ({STATS.trustpilotReviews} avis)</span>
              <span>★ {STATS.googleScore} Google ({STATS.googleReviews} avis)</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Sophie L.", text: "Grâce à la méthode, j'ai acheté mon premier appartement en 4 mois.", src: "Trustpilot" },
              { name: "Thomas R.", text: "Les outils fournis m'ont fait gagner un temps fou. 3 biens en 18 mois.", src: "Google" },
              { name: "Marie D.", text: "Emeline explique tout simplement. Même sans connaissance, on passe à l'action.", src: "Trustpilot" },
              { name: "Julien M.", text: "Le module négociation m'a permis d'obtenir -15% sur un immeuble de 5 lots.", src: "Google" },
              { name: "Camille B.", text: "La partie fiscalité est incroyablement bien expliquée. Optimisation dès la première année.", src: "Trustpilot" },
              { name: "Alexandre P.", text: "De 0 à 8 lots en 2 ans. La méthode fonctionne si on suit les étapes.", src: "Google" },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 card-hover">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-es-terracotta" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-es-text-muted leading-relaxed mb-4">&laquo; {t.text} &raquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-es-green/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-es-green">{t.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-es-text">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-es-text-muted/50">{t.src}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">FAQ</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Questions fréquentes</h2>
          </div>
          <Accordion items={faqItems} />
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-es-green-dark text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-white mb-4">Prêt(e) à transformer ton avenir ?</h2>
          <Button variant="cta" size="lg" className="btn-gold-shimmer" href="#offre">
            Rejoindre la formation — {PRICING.academy.priceDisplay}€
          </Button>
        </div>
      </section>

      <BottomBanner />
      <Footer />
      <MobileCta text="Rejoindre — 998€" href="#offre" />
    </div>
  );
}
