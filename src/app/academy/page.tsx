import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { TestimonialsGrid } from "@/components/marketing/TestimonialsGrid";
import { AcademyCheckoutButtons } from "@/components/marketing/AcademyCheckoutButtons";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { MobileCta } from "@/components/ui/MobileCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseSchema, faqSchema, productSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { ViewItemTracker } from "@/components/analytics/ViewItemTracker";
import { STATS, PRICING, MODULES_PROGRAMME, SITE_URL, SOCIAL_LINKS } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "ES Academy : la méthode Emeline Siron pour investir",
  description: "La formation pour investir en immobilier locatif et viser l'autofinancement. 30h de cours, 91 outils, communauté ES Family incluse 3 mois.",
  path: "/academy",
  image: `${SITE_URL}/og/og-default.jpg`,
});

const faqItems = [
  { question: "Que se passe-t-il après l'inscription ?", answer: "Tu reçois immédiatement tes identifiants par email. Tu accèdes à l'intégralité de la formation, des outils et de la communauté ES Family pendant 3 mois." },
  { question: "Combien de temps ai-je accès au contenu ?", answer: "Si tu termines la formation en 3 mois, tu gardes un accès illimité. Les mises à jour et replays sont inclus à vie." },
  { question: "Comment fonctionne le coaching sur mesure ?", answer: "Le coaching est un accompagnement individualisé adapté à ton profil et tes objectifs. Contacte-nous pour un devis personnalisé." },
  { question: "Les sessions collectives sont-elles enregistrées ?", answer: "Oui, toutes les sessions de mentorat collectives sont enregistrées et disponibles en replay dans ton espace." },
  { question: "Quelle est la politique de remboursement ?", answer: "Tu disposes de 14 jours pour tester la formation. Si elle ne te convient pas, envoie un email et tu es remboursé(e) intégralement." },
];

const BUNNY_LIBRARY_ID = "636029";

const videoTestimonials = [
  { name: "Clément A.", bunnyId: "ab6610e8-c958-4330-971d-9d17da91844d" },
  { name: "Ketty R.", bunnyId: "1c7af189-a052-4305-9c48-594573701f21" },
  { name: "Maxime B.", bunnyId: "ff29c8a8-c295-46a7-97b4-8b4607c68be6" },
  { name: "Pauline C.", bunnyId: "ff674fb4-4aba-43e5-bcf2-81d247b11a65" },
];

export default function AcademyPage() {
  return (
    <div className="min-h-screen">
      <Header activePage="academy" />
      <JsonLd data={[
        courseSchema(),
        productSchema(),
        faqSchema(faqItems),
        breadcrumbSchema([
          { name: "Accueil", url: SITE_URL },
          { name: "Academy", url: `${SITE_URL}/academy` },
        ]),
      ]} />
      <ViewItemTracker
        itemId="academy"
        itemName="ES Academy"
        itemCategory="formation"
        value={998}
      />

      {/* 1. Hero : Style B Dark */}
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
            Rejoindre le programme : {PRICING.academy.priceDisplay}€
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

      {/* En coulisses (placeholder en attendant la vidéo de présentation) */}
      <section className="py-24 bg-es-green-dark relative overflow-hidden">
        {/* Watermark décoratif "Emeline" */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span className="font-serif italic text-white/[0.04] text-[20vw] leading-none whitespace-nowrap">
            Emeline
          </span>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="text-xs text-es-gold uppercase tracking-[0.3em] font-medium">
                En coulisses
              </span>
              <div className="mx-auto mt-3 w-12 h-px bg-es-gold/40" />
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-6">
                La méthode,{" "}
                <span className="italic text-es-gold font-normal">par celle qui la vit.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  src: "/images/site/01-chantier-action/chantier-04-spatule-salle-de-bain.jpeg",
                  alt: "Emeline en plein chantier, spatule en bouche, escalier en rénovation",
                  rotate: "-rotate-3",
                },
                {
                  src: "/images/site/01-chantier-action/chantier-08-enceinte-perceuse-cartons.jpeg",
                  alt: "Emeline perceuse en main devant un mur en travaux",
                  rotate: "rotate-1",
                },
                {
                  src: "/images/site/01-chantier-action/chantier-07-enceinte-carrelage-signature.jpeg",
                  alt: "Emeline accroupie sur un chantier extérieur avec ses outils",
                  rotate: "rotate-3",
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`relative ${p.rotate} hover:rotate-0 transition-transform duration-500 shadow-2xl rounded-2xl overflow-hidden bg-white/5`}
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              <p className="text-white/60 text-sm">La vidéo de présentation arrive bientôt.</p>
              <p className="text-es-gold text-xs uppercase tracking-widest mt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-es-gold mr-2 align-middle" />
                emeline-siron.fr
              </p>
            </div>
          </ScrollReveal>
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
                  question: `Module ${mod.number} : ${mod.title}`,
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
                Valeur totale <span className="line-through">3 450€</span>
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl sm:text-7xl lg:text-8xl font-bold text-es-cream">998€</span>
                <span className="text-lg font-normal text-es-cream/50">TTC</span>
              </div>
              <p className="text-base text-es-cream/70 mt-3">Paiement en 1, 3 ou 4 fois sans frais</p>
              <p className="text-sm text-es-terracotta-light mt-4 font-medium">Déjà plus de 1 900 investisseurs formés</p>
            </div>
          </ScrollReveal>

          {/* 3. Grille 2 colonnes */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-6 lg:gap-12 mb-12 lg:mb-16">
            {/* Colonne gauche : La formation (fond dore pour differencier de la carte Family terracotta) */}
            <ScrollReveal delay={100}>
              <div className="h-full bg-gradient-to-br from-es-gold/20 to-es-gold/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border-2 border-es-gold/60 shadow-2xl shadow-es-green-dark/50 ring-1 ring-es-gold/20 relative">
                <div className="flex items-center gap-3 mb-4 pb-5 border-b border-es-gold/20">
                  <span className="text-3xl shrink-0" aria-hidden>🎓</span>
                  <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-es-cream">La formation</h3>
                </div>
                <ul className="space-y-5">
                  {[
                    { strong: "30h de formation vidéo structurée", rest: ", du zéro aux stratégies avancées (LMNP, colocation, immeuble de rapport, SCI, fiscalité)" },
                    { strong: "91 outils prêts à l'emploi", rest: " : calculateurs, modèles de négociation, checklists visites, trames de baux, grilles d'analyse" },
                    { strong: "Quiz final de validation", rest: " : mesure tes acquis à la fin du parcours et identifie les points à renforcer" },
                    { strong: "Accès à vie + mises à jour incluses", rest: " : le marché bouge, ta formation aussi" },
                    { strong: "Option Coaching sur mesure", rest: " : un expert dédié t'accompagne à chaque étape, calibré selon ton profil et ton projet (sur devis, activable à tout moment)" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-es-green-light mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-es-cream/90 text-lg leading-relaxed">
                        <strong className="text-es-cream font-semibold">{item.strong}</strong>
                        {item.rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Colonne droite : ES Family (offert 3 mois) */}
            <ScrollReveal delay={200}>
              <div className="h-full bg-gradient-to-br from-es-terracotta/20 to-es-terracotta/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border-2 border-es-terracotta/60 shadow-2xl shadow-es-green-dark/50 ring-1 ring-es-gold/20 relative">
                <div className="flex items-center gap-3 mb-4 pb-5 border-b border-es-terracotta/20">
                  <span className="text-3xl shrink-0" aria-hidden>🔑</span>
                  <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-es-cream">+ 3 mois ES Family offerts</h3>
                </div>

                <p className="italic text-es-cream/80 text-lg leading-relaxed mb-6">
                  ES Family, c&apos;est la communauté privée qui fait passer la théorie à l&apos;action.
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
                      <svg className="w-6 h-6 text-es-terracotta-light mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-es-cream/90 text-lg leading-relaxed">
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
              <AcademyCheckoutButtons />
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
            <p className="text-es-text-muted mt-3 text-sm">Quatre élèves racontent ce que la méthode a changé pour eux.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTestimonials.map((t, i) => (
              <ScrollReveal key={t.bunnyId} delay={i * 120}>
                <figure className="group">
                  <div className="aspect-[9/16] rounded-2xl overflow-hidden relative bg-es-green-dark shadow-lg ring-1 ring-es-green-dark/10 group-hover:shadow-xl group-hover:ring-es-gold/30 transition-all duration-300">
                    <iframe
                      src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${t.bunnyId}?autoplay=false&preload=false&responsive=true`}
                      title={`Témoignage vidéo de ${t.name}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <figcaption className="mt-4 text-center">
                    <p className="font-serif text-base text-es-text font-semibold">{t.name}</p>
                    <p className="text-es-text-muted text-xs uppercase tracking-widest mt-1">Élève ES Academy</p>
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Avis texte - Trustpilot vérifiés */}
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
              {
                name: "Romy",
                date: "19 avril 2024",
                title: "Formation au top",
                text: "Une formation très complète et riche animée par Emeline, une vraie passionnée et surtout une jeune femme très authentique et dynamique. Elle m'a permise d'acquérir des bases solides dans le domaine et surtout me donner l'envie d'y croire. Je recommande à tous les novices de s'inscrire car le soutien et l'accompagnement de l'équipe dans sa globalité sont excellents.",
              },
              {
                name: "S. G.",
                date: "22 juillet 2024",
                title: "Excellente formation en investissement immobilier",
                text: "J'ai récemment suivi la formation en immobilier locatif proposée par Evermind et je suis très satisfaite de cette expérience. J'étais novice dans le sujet et ça m'a beaucoup apporté ! Emeline est une experte passionnée, capable de rendre accessibles des concepts parfois complexes. Le contenu est bien structuré et regorge d'exemples pratiques et d'études de cas concrets. Je recommande vivement cette formation à tous ceux qui souhaitent réussir dans l'investissement locatif !",
              },
              {
                name: "Damien",
                date: "27 août 2024",
                title: "Très bonne formation",
                text: "Très bonne formation de la part d'Evermind tant dans le suivi que dans le contenu. Emeline partage un bon nombre de conseils, d'anecdotes et met à disposition des outils facilitant le passage à l'action (BP, prix moyens des prestations travaux par typologie, dossier de financement…). Je recommande.",
              },
              {
                name: "Deborah B.",
                date: "3 octobre 2024",
                title: "Je recommande à 1000%",
                text: "Je recommande à 1000%, la formation va dans un niveau de détail impressionnant, tout est carré, ça rassure vraiment pour se lancer et permet d'éviter beaucoup d'erreurs. Emeline est d'une énergie débordante, c'est inspirant, ça donne envie de se donner à fond.",
              },
              {
                name: "Laura R.",
                date: "28 novembre 2025",
                title: "Un coaching précis et personnalisé",
                text: "Emeline est toujours à la fois humaine, à l'écoute dans son coaching et précise, professionnelle. Elle ne perd jamais le nord et reste positive même dans les situations compliquées. Cela rend l'accompagnement chaleureux tout en ayant pas l'impression que l'émotion prend le dessus.",
              },
              {
                name: "Myriam",
                date: "5 mars 2026",
                title: "Formation de qualité",
                text: "Je vous recommande cette formation si vous voulez être plus serein lorsque vous achetez un bien. La formation est très complète avec tous les éléments pour être un bon investisseur immobilier. Emeline est très pédagogue et ses explications sont très claires. Je n'ai pas encore fait le coaching individuel mais j'ai hâte de m'y mettre.",
              },
            ].map((t, i) => (
              <a
                key={i}
                href={SOCIAL_LINKS.trustpilot}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-6 border border-es-cream-dark hover:border-es-terracotta/40 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="w-5 h-5 bg-[#00B67A] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-es-text-muted/60">{t.date}</span>
                </div>
                <p className="text-sm font-semibold text-es-text mb-2">{t.title}</p>
                <p className="text-sm text-es-text-muted leading-relaxed mb-4 line-clamp-5">{t.text}</p>
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-es-cream-dark">
                  <div className="w-7 h-7 rounded-full bg-es-green/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-es-green">{t.name[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-es-text flex-1">{t.name}</span>
                  <span className="text-[10px] text-[#00B67A] font-semibold">Trustpilot ↗</span>
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href={SOCIAL_LINKS.trustpilot}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-es-text-muted hover:text-es-terracotta transition-colors"
            >
              Voir tous les avis sur Trustpilot
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
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
            Rejoindre la formation : {PRICING.academy.priceDisplay}€
          </Button>
        </div>
      </section>

      <BottomBanner />
      <Footer />
      <MobileCta text="Rejoindre : 998€" href="#offre" />
    </div>
  );
}
