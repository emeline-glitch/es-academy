import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileCta } from "@/components/ui/MobileCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ViewItemTracker } from "@/components/analytics/ViewItemTracker";
import { SITE_URL } from "@/lib/utils/constants";
import { Users, Play, Sparkles, Calculator, Radio, FileText, Tag, HeartHandshake, Trophy } from "lucide-react";

const iconMap = { Users, Play, Sparkles, Calculator, Radio, FileText, Tag, HeartHandshake, Trophy } as const;

type FeatureIcon = keyof typeof iconMap;

const FAMILY_FEATURES: Array<{ number: string; icon: FeatureIcon; title: string; description: string }> = [
  { number: "01", icon: "Users", title: "Le feed de la communauté", description: "Trois piliers : Immo, Patrimoine, Transversal. Tu poses tes questions, tu trouves des réponses précises." },
  { number: "02", icon: "Play", title: "Vidéos formations à la demande", description: "Immo, patrimoine, fiscalité, placements, entrepreneuriat. Tu regardes quand tu veux." },
  { number: "03", icon: "Sparkles", title: "Le rituel quotidien", description: "Daily quiz, stats du marché, top articles de la semaine. 5 minutes pour te tenir au courant." },
  { number: "04", icon: "Calculator", title: "5 simulateurs pour décider vite", description: "Capacité d'emprunt, cashflow, frais de notaire, prix au m², rendement." },
  { number: "05", icon: "Radio", title: "Lives mensuels + replays à vie", description: "Emeline et ses experts invités : fiscaliste, expert-comptable, artisans, décoratrice." },
  { number: "06", icon: "FileText", title: "Ressources prêtes à l'emploi", description: "Modèles de courriers, fiches financement, ebooks mensuels. 34 fiches actuellement." },
  { number: "07", icon: "Tag", title: "Les bons plans de Sorel", description: "Les promos matériaux et mobilier qu'Emeline utilise sur ses propres chantiers." },
  { number: "08", icon: "HeartHandshake", title: "Partenaires + coaching Emeline", description: "Tarifs négociés courtiers, assurances PNO, artisans. Et un coaching visio direct avec Emeline." },
  { number: "09", icon: "Trophy", title: "Annuaire, gamification, parrainage", description: "Retrouve les membres par région, par projet, par nombre de lots. Badges et code parrain." },
];

export const metadata: Metadata = buildMetadata({
  title: "ES Family : la communauté patrimoniale d'Emeline Siron",
  description: "Immobilier, bourse, fiscalité, actifs alternatifs : la communauté des investisseurs qui construisent leur patrimoine. Tarif fondateur 19€/mois.",
  path: "/family",
});

// Skool abandonne avril 2026 (cf. memory feedback_no_skool).
// Le CTA fait scroll vers la section tarifs ; le checkout Stripe sera branche
// sur la card Fondateur via STRIPE_PRICE_FAMILY_FONDATEUR.
// Pointe vers la route GET checkout-family qui cree une session Stripe puis
// redirige (303) vers la page Stripe Checkout. Utilise STRIPE_PRICE_FAMILY_FONDATEUR.
const FAMILY_CTA_HREF = "/api/stripe/checkout-family?plan=fondateur";

const faqItems = [
  { question: "Qu'est-ce qu'ES Family exactement ?", answer: "ES Family est une communauté patrimoniale pour investisseurs ambitieux. Tu accèdes à des analyses flash, des lives mensuels, des opportunités exclusives et un réseau de membres qui partagent les mêmes objectifs." },
  { question: "À quelle fréquence le contenu est-il publié ?", answer: "Plusieurs fois par semaine : analyses vidéo flash, un live mensuel avec Emeline et ses partenaires experts, un ebook mensuel, et des opportunités en continu." },
  { question: "Comment fonctionne le prix fondateur ?", answer: "Les 500 premiers membres bénéficient du tarif fondateur à 19€/mois, garanti à vie tant que l'abonnement reste actif. Après les 500 places, le prix passe à 29€/mois." },
  { question: "Puis-je me désabonner à tout moment ?", answer: "Oui, sans engagement. Tu peux annuler ton abonnement à tout moment. Si tu es fondateur et que tu te désabonnes, tu perds le tarif garanti." },
  { question: "Quelle est la différence entre ES Family et ES Academy ?", answer: "ES Academy est une formation complète de 30h pour apprendre à investir. ES Family est une communauté mensuelle pour rester informée, networker et accéder à des opportunités. Les deux se complètent." },
  { question: "Je débute vraiment dans l'investissement, est-ce que c'est pour moi ?", answer: "ES Family n'est pas une formation. Si tu n'as aucune base, je te recommande d'abord ES Academy pour apprendre les fondamentaux (tu as 3 mois d'ES Family offerts avec). Si tu as déjà acheté un bien ou si tu es déterminée à passer à l'action, ES Family est l'environnement qui te fera avancer plus vite." },
  { question: "Combien de temps ça me prend par semaine ?", answer: "Tu définis ton rythme. Les membres les plus actifs passent 2 à 3 heures par semaine (lives, échanges dans les groupes, contenus). Les plus passifs consomment uniquement les ebooks mensuels et les replays. Les deux usages sont légitimes." },
  { question: "Est-ce que je peux annuler si ça ne me plaît pas ?", answer: "Oui, tu peux annuler à tout moment sans engagement. Attention : si tu es au tarif fondateur et que tu te désabonnes, tu perds le tarif à 19€/mois et repasseras à 29€/mois si tu veux revenir." },
];

export default async function FamilyPage(props: {
  searchParams: Promise<{ from?: string; status?: string }>;
}) {
  const { from, status } = await props.searchParams;
  const isAcademyBlocked = from === "academy-blocked";
  const isLaunchPending = status === "launch-pending";

  return (
    <div className="min-h-screen">
      <Header activePage="family" />
      <JsonLd data={[
        faqSchema(faqItems),
        breadcrumbSchema([
          { name: "Accueil", url: SITE_URL },
          { name: "Family", url: `${SITE_URL}/family` },
        ]),
      ]} />
      <ViewItemTracker
        itemId="family-fondateur"
        itemName="ES Family Fondateur"
        itemCategory="abonnement"
        value={19}
      />

      {/* Banniere discrete : affichee uniquement quand l'user clique un CTA Family
          alors que le checkout Stripe est verrouille (FAMILY_LAUNCH_PENDING).
          Le reste de la page Family est totalement consultable. */}
      {isLaunchPending && (
        <section className="bg-es-mint-pastel border-b border-es-mint">
          <div className="max-w-4xl mx-auto px-6 py-3 text-center">
            <p className="text-sm text-es-mint-dark">
              <strong>App ES Family en validation Apple.</strong>{" "}
              Le checkout est temporairement indisponible, on revient vers toi
              des que l&apos;app est publiee (quelques jours). En attendant,{" "}
              <a href="/academy" className="underline font-semibold">
                ES Academy inclut 3 mois Family offerts
              </a>{" "}
              au lancement.
            </p>
          </div>
        </section>
      )}

      {/* Bandeau quand un user Family-only tente d'accéder à la plateforme Academy.
          Cf gating dans src/app/(platform)/layout.tsx. */}
      {isAcademyBlocked && (
        <section className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-amber-900 font-semibold mb-1">
                Tu as ES Family, pas ES Academy.
              </p>
              <p className="text-sm text-amber-800">
                La plateforme de formation (cours, modules, examens) est réservée aux acheteurs d&apos;ES Academy.
                Pour accéder à ton espace Family (lives, communauté, ressources), connecte-toi sur l&apos;app dédiée.
              </p>
            </div>
            <a
              href="https://esfamily.fr/connexion"
              className="flex-shrink-0 inline-block bg-es-mint-dark text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-es-mint-deep transition whitespace-nowrap"
            >
              Aller sur Family
            </a>
          </div>
        </section>
      )}

      {/* Hero : L'école t'a appris à travailler */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: "#B8EBDD" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-es-mint/15 via-transparent to-es-mint-dark/10" />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #006B58 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="font-serif italic text-es-mint-dark/80 text-sm sm:text-base mb-6 tracking-wide">
                Patrimoine, fiscalité, investissement : tout ce qu&apos;on ne t&apos;a jamais appris à l&apos;école
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-es-text leading-[1.1] mb-6">
                L&apos;école t&apos;a appris à travailler.{" "}
                <span className="block mt-2 text-es-mint-dark">
                  Pas à t&apos;enrichir.
                </span>
              </h1>
              <p className="text-lg text-es-text mb-4 leading-relaxed font-medium">
                Pas juste un groupe immo. Un écosystème patrimoine complet : immo, bourse, fiscalité, entrepreneuriat, mindset : dans ta poche, 7j/7.
              </p>
              <p className="text-base text-es-text-light mb-4 leading-relaxed">
                ES Family, c&apos;est la communauté qui prend le relais là où l&apos;école s&apos;est arrêtée. <strong className="text-es-mint-dark">1 800 membres déjà actifs. Encore 500 places au tarif fondateur.</strong>
              </p>
              <p className="text-sm text-es-text-muted mb-10 leading-relaxed italic">
                Plateforme mobile conçue et développée en interne par Emeline.
              </p>

              <TrackedLink
                href={FAMILY_CTA_HREF}
                event="cta_family_click"
                eventParams={{ plan: "fondateur", value: 19, currency: "EUR" }}
                data-cta="family-hero-fondateur"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-10 py-5 text-lg bg-es-mint-dark text-white hover:bg-es-mint-deep transition-all shadow-lg hover:shadow-xl"
              >
                Rejoindre ES Family à 19€/mois
              </TrackedLink>
              <p className="text-xs text-es-text-muted mt-4">
                Pour le prix d&apos;un forfait téléphonique · Sans engagement
              </p>
            </div>

            {/* Mockup 3 iPhones : Toute la Family dans ta poche */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-md mx-auto lg:max-w-none w-full">
              <Image
                src="/images/family/family-iphone-mockup.png"
                alt="Mockup de l'app ES Family sur 3 iPhones : Discussions, Actu, Découvrir"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points : Les 4 raisons pour lesquelles tu stagnes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text">
              Les 4 raisons pour lesquelles tu stagnes
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                num: "01",
                title: "Tu es seule à décider.",
                body: "Ton banquier ne connaît pas ta stratégie. Ton comptable réagit à tes chiffres au lieu de les orienter. Ta famille te freine par peur. Résultat : tu prends des décisions avec 50% d'information.",
              },
              {
                num: "02",
                title: "Tu n'as pas de sparring partner.",
                body: "Tu veux valider une annonce ? Un montage ? Un financement ? Tu postes sur Reddit ou un groupe Facebook. Tu reçois 15 avis contradictoires. Tu choisis celui qui te fait plaisir. Et tu fais l'erreur.",
              },
              {
                num: "03",
                title: "Tu perds des milliers d'euros en fiscalité.",
                body: "Parce que tu ne sais pas quel statut optimiser. Parce que tu n'as pas de fiscaliste à disposition. Parce que tu crois que « ça va aller » et qu'en avril tu pleures.",
              },
              {
                num: "04",
                title: "Tu ne progresses pas.",
                body: "Tu en es au même point qu'il y a un an. Même bien, même stratégie, même fiscalité. Tu lis des livres. Tu écoutes des podcasts. Tu sais que ça ne suffit pas.",
              },
            ].map((item) => (
              <div key={item.num} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="font-serif text-5xl font-bold text-es-mint-dark mb-4 leading-none">{item.num}</div>
                <h3 className="font-serif text-xl font-bold text-es-text mb-3">{item.title}</h3>
                <p className="text-es-text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="font-serif text-xl text-es-text max-w-3xl mx-auto leading-relaxed">
              ES Family répond à ces quatre problèmes. Une communauté active, des partenaires vérifiés, des échanges quotidiens.
              <strong className="block mt-2 text-es-mint-dark">Tu arrêtes de stagner.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Features : Un seul abonnement (layout editorial, inspiration Linear/Vercel/Stripe) */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-widest text-es-terracotta font-medium">
              L&apos;application
            </p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl text-es-green leading-tight">
              Un seul abonnement, 12 usages dans ta poche
            </h2>
            <p className="mt-6 text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Formation, communauté, outils, coaching, bons plans, partenaires. Tout est centralisé dans une app mobile pensée pour être consultée au quotidien.
            </p>
          </div>

          {/* Grille features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {FAMILY_FEATURES.map((feature) => {
              const Icon = iconMap[feature.icon];
              return (
                <div key={feature.number} className="group transition-all duration-300">
                  <p className="text-sm text-es-terracotta tabular-nums opacity-60 mb-4 transition-transform duration-300 group-hover:translate-x-1">
                    {feature.number}
                  </p>
                  <Icon className="w-7 h-7 text-es-green mb-5" strokeWidth={1.5} />
                  <h3 className="font-serif text-xl text-es-green mb-3 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-stone-700">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer phrase : Pas juste de l'immo */}
          <div className="mt-24 max-w-3xl border-l-2 border-es-terracotta pl-6">
            <p className="text-base text-stone-700 leading-relaxed">
              Pas juste de l&apos;immo. <span className="text-es-green font-medium">Tout ce qui fait une vraie indépendance financière</span> : bourse, fiscalité, actifs alternatifs, transmission, entrepreneuriat, mindset.
            </p>
          </div>
        </div>
      </section>

      {/* Vue d'ensemble plateforme (en attendant la vidéo de présentation) */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/family/family-platform-overview.jpg"
                alt="Vue d'ensemble de la plateforme ES Family : patrimoine immobilier, simulateurs et outils, communauté, ressources exclusives, coaching et accompagnement, partenaires de confiance"
                fill
                sizes="(max-width: 1024px) 95vw, 1024px"
                className="object-contain"
              />
            </div>
            <p className="text-xs text-es-text-muted mt-4 text-center italic">
              Plateforme développée en interne par Emeline Siron.
            </p>
          </div>

        </div>
      </section>

      {/* Cartes tarifaires : Fondateur + Standard */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-mint-dark uppercase tracking-widest font-medium">Tarif fondateur</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mt-3 mb-3">
              Réservé aux 500 premiers membres
            </h2>
            <p className="text-es-text-muted max-w-xl mx-auto">
              Choisis ta formule. Le tarif fondateur reste bloqué tant que ton abonnement est actif.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {/* Carte Fondateur : 60% */}
            <div className="md:col-span-3 bg-es-mint-pastel rounded-2xl p-8 text-es-text relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-es-mint-dark/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <span className="relative inline-flex items-center bg-red-800 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                Offre lancement
              </span>
              <h3 className="font-serif text-3xl font-bold mb-1 relative text-es-text">FONDATEUR</h3>
              <p className="text-es-text-muted text-sm mb-6 relative">Les 500 premiers membres</p>
              <div className="text-5xl font-bold my-5 relative text-es-text">
                19€<span className="text-lg font-normal text-es-text-muted">/mois TTC</span>
              </div>
              <p className="text-es-text-muted text-sm mb-6 relative">Tarif bloqué tant que l&apos;abonnement reste actif*</p>
              <TrackedLink
                href={FAMILY_CTA_HREF}
                event="cta_family_click"
                eventParams={{ plan: "fondateur", value: 19, currency: "EUR", placement: "pricing_card" }}
                data-cta="family-pricing-fondateur"
                className="relative block w-full text-center font-semibold rounded-lg px-8 py-4 bg-es-mint-dark text-white hover:bg-es-mint-deep transition-all mb-8 shadow-md"
              >
                Rejoindre à 19€/mois
              </TrackedLink>
              <ul className="space-y-3 relative">
                {[
                  "Tout le contenu ES Family (analyses, lives, ebooks, groupes, partenaires, simulateurs, fichiers)",
                  "Accès à tous les groupes thématiques",
                  "Badge « Membre fondateur » visible dans l'annuaire",
                  "Accès immédiat à la plateforme",
                  "Tarif conservé tant que ton abonnement reste actif",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-es-text">
                    <svg className="w-5 h-5 text-es-mint-dark mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-es-text-muted mt-6 relative">*Sous réserve d&apos;abonnement continu</p>
            </div>

            {/* Carte Standard : 40%, grisée */}
            <div className="md:col-span-2 bg-gray-100 rounded-2xl p-8 opacity-70 relative">
              <h3 className="font-serif text-2xl font-bold text-gray-500 mb-1 mt-9">STANDARD</h3>
              <p className="text-gray-400 text-sm mb-6">Après les 500 fondateurs</p>
              <div className="text-4xl font-bold text-gray-400 my-5">
                29€<span className="text-base font-normal text-gray-300">/mois TTC</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">Tarif sans blocage</p>
              <div className="w-full bg-gray-200 text-gray-400 text-center py-4 rounded-lg font-medium mb-8">
                Bientôt disponible
              </div>
              <ul className="space-y-3">
                {[
                  "Tout le contenu ES Family",
                  "Accès à tous les groupes thématiques",
                  "Pas de badge fondateur",
                  "Tarif sans blocage",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-gray-400 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bridge Academy : Tu veux les deux ? (split image/texte) */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: "#2D6A4F" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] max-w-md mx-auto md:max-w-none w-full">
              <Image
                src="/images/site/01-chantier-action/chantier-02-masse-parpaings.jpeg"
                alt="Emeline en action sur un chantier, l'approche concrète d'ES Academy"
                width={1600}
                height={1200}
                className="w-full h-full object-cover object-center"
                quality={85}
              />
            </div>
            {/* Texte */}
            <div className="text-center md:text-left text-white">
              <span className="text-xs text-es-gold uppercase tracking-widest font-medium">ES Academy</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-3 mb-5">
                Tu veux les deux ?
              </h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Avec ES Academy, tu reçois <strong>3 mois d&apos;ES Family offerts</strong>. Tu apprends les fondamentaux sur 30h de formation et 91 outils, puis tu rejoins la communauté pour la suite.
                C&apos;est le duo le plus efficace pour passer de 0 à plusieurs biens.
              </p>
              <a
                href="/academy"
                data-cta="family-bridge-academy"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-base bg-white text-es-green hover:bg-es-cream transition-all shadow-md"
              >
                Découvrir ES Academy
              </a>
              <p className="text-xs text-white/50 mt-4">
                Économie équivalente à 3 mois d&apos;ES Family fondateur inclus dans ton achat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-mint-dark uppercase tracking-widest font-medium">FAQ</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Questions fréquentes</h2>
          </div>
          <Accordion items={faqItems} />
        </div>
      </section>

      <BottomBanner accent="mint" />
      <Footer />
      <MobileCta text="Rejoindre ES Family" href={FAMILY_CTA_HREF} variant="mint" />
    </div>
  );
}
