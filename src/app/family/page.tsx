import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileCta } from "@/components/ui/MobileCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo/schemas";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { FamilyTestimonials } from "@/components/marketing/FamilyTestimonials";

export const metadata: Metadata = {
  title: "ES Family | La communauté patrimoniale d'Emeline Siron",
  description: "Immobilier, bourse, fiscalité, actifs alternatifs : la communauté des investisseurs qui construisent leur patrimoine. 1 900 investisseurs, tarif fondateur 19€/mois.",
};

const SKOOL_URL = "https://www.skool.com/es-family";

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

export default function FamilyPage() {
  return (
    <div className="min-h-screen">
      <Header activePage="family" />
      <JsonLd data={faqSchema(faqItems)} />

      {/* Hero — L'école t'a appris à travailler */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: "#C4724A" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-es-terracotta-dark/20 via-transparent to-black/10" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="font-serif italic text-white/70 text-sm sm:text-base mb-6 tracking-wide">
                Patrimoine, fiscalité, investissement : tout ce qu&apos;on ne t&apos;a jamais appris à l&apos;école
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                L&apos;école t&apos;a appris à travailler.{" "}
                <span className="block mt-2 text-white" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.15)" }}>
                  Pas à t&apos;enrichir.
                </span>
              </h1>
              <p className="text-lg text-white/85 mb-4 leading-relaxed">
                Immobilier, bourse, fiscalité, transmission, actifs alternatifs : les règles du patrimoine, personne ne te les explique vraiment.
              </p>
              <p className="text-lg text-white/85 mb-4 leading-relaxed">
                ES Family, c&apos;est la communauté qui prend le relais. <strong>1 900 investisseurs dans l&apos;écosystème. Encore 500 places pour le tarif fondateur.</strong>
              </p>
              <p className="text-sm text-white/60 mb-10 leading-relaxed italic">
                Plateforme conçue et développée en interne par Emeline.
              </p>

              <a
                href={SKOOL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-10 py-5 text-lg bg-white text-es-terracotta hover:bg-es-cream transition-all shadow-lg hover:shadow-xl"
              >
                Rejoindre ES Family à 19€/mois
              </a>
              <p className="text-xs text-white/50 mt-4">
                Pour le prix d&apos;un forfait téléphonique · Sans engagement
              </p>
            </div>

            {/* Hero image — coeur peint, symbole de l'amour de la communauté */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] max-w-md mx-auto lg:max-w-none w-full">
              <Image
                src="/images/site/01-chantier-action/chantier-09-coeur-vert-peint.jpeg"
                alt="Emeline peignant un cœur sur un mur, symbole de la communauté ES Family"
                width={1600}
                height={1200}
                className="absolute inset-0 w-full h-full object-cover object-center"
                quality={85}
              />
              {/* Léger gradient pour accrocher la photo à la section sans la flinguer */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points — Les 4 raisons pour lesquelles tu stagnes */}
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
                <div className="font-serif text-5xl font-bold text-es-terracotta mb-4 leading-none">{item.num}</div>
                <h3 className="font-serif text-xl font-bold text-es-text mb-3">{item.title}</h3>
                <p className="text-es-text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="font-serif text-xl text-es-text max-w-3xl mx-auto leading-relaxed">
              ES Family répond à ces quatre problèmes. Une communauté active, des partenaires vérifiés, des échanges quotidiens.
              <strong className="block mt-2 text-es-terracotta">Tu arrêtes de stagner.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Features — Tout ce dont tu as besoin */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">L&apos;application</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tout ce dont tu as besoin, au même endroit</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bloc 1 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Reste informée sans effort</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">Actus immo, fiscalité et marché triées pour toi chaque semaine. Les sujets importants remontent automatiquement.</p>
              {/* TODO: Ajouter screenshot [SCREENSHOT_BLOC_1] */}
            </div>

            {/* Bloc 2 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Pose tes questions, obtiens des réponses</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">Des groupes thématiques actifs où tu postes ton cas et où les membres expérimentés te répondent dans la journée.</p>
              {/* TODO: Liste finale des groupes thématiques à définir [LISTE_GROUPES_À_DÉFINIR] */}
            </div>

            {/* Bloc 3 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Apprends des meilleurs chaque semaine</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">Lives mensuels avec moi et mes partenaires experts (fiscaliste, expert-comptable, artisan, décoratrice). Tous les replays accessibles à vie.</p>
            </div>

            {/* Bloc 4 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Des outils pro à portée de main</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">4 simulateurs intégrés (notaire, rendement, cashflow, emprunt). 34 fichiers pratiques classés par thème. Le podcast Out of the Box en accès direct.</p>
            </div>

            {/* Bloc 5 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Des partenaires vérifiés</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">6 partenaires experts accessibles aux membres (fiscaliste, expert-comptable, artisan, décoratrice, etc.). Codes promo réservés. Coaching accessible avec moi.</p>
            </div>

            {/* Bloc 6 */}
            <div className="bg-es-cream rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-es-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-es-text mb-2">Une reconnaissance entre membres</h3>
              <p className="text-sm text-es-text-muted leading-relaxed">Les membres qui contribuent régulièrement (réponses, partages d&apos;expérience, accompagnement des nouveaux) sont mis en avant. C&apos;est toi qui fais vivre ES Family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dans la plateforme — vidéo démo */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Visite guidée</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tu veux voir l&apos;intérieur avant de t&apos;engager ?</h2>
          </div>

          {/* Vidéo démo principale */}
          <div className="max-w-3xl mx-auto">
            {/* TODO: Remplacer par Loom embed [VIDEO_DEMO_URL] avec thumbnail [VIDEO_THUMBNAIL] */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-es-terracotta via-es-terracotta-dark to-es-terracotta/80 shadow-xl cursor-pointer group">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-es-terracotta ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <p className="text-white font-medium text-lg">Visite guidée d&apos;ES Family par Emeline</p>
                <p className="text-white/70 text-sm">60 secondes</p>
              </div>
            </div>
            <p className="text-xs text-es-text-muted mt-4 text-center italic">
              Plateforme développée en interne par Emeline Siron.
            </p>
          </div>

          {/* Screenshots */}
          <div className="mt-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* TODO: Remplacer les 5 placeholders par les vrais screenshots */}
              {[
                "Accueil",
                "Groupe thématique",
                "Live replay",
                "Simulateur",
                "Annuaire membres",
              ].map((label) => (
                <div key={label} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-es-cream-dark to-es-cream border border-es-cream-dark/50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-2">
                      <svg className="w-8 h-8 mx-auto text-es-terracotta/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-es-text-muted font-medium">{label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offre fondateur */}
      <section className="relative py-16 overflow-hidden" style={{ backgroundColor: "#2c6e55" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-es-green-dark/30 via-transparent to-es-green-light/10" />
        <div className="relative max-w-2xl mx-auto px-6 text-center text-white">
          <span className="inline-flex items-center bg-es-gold text-white text-xs font-bold px-3 py-1 rounded-full mb-5">
            500 PLACES, JAMAIS PLUS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Offre fondateur : 500 places, jamais plus</h2>
          <div className="text-5xl sm:text-6xl font-bold my-5">
            19€<span className="text-xl font-normal text-white/60">/mois</span>
          </div>
          <p className="text-white/80 text-base font-medium mb-2">À vie. Sans surprise.</p>
          <p className="text-white/50 text-sm mb-8">
            Après les 500 fondateurs, tarif Standard à 29€/mois.
          </p>
          <p className="text-white/60 text-sm mb-8 font-medium">Encore 500 places disponibles</p>
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-10 py-4 text-lg bg-es-cream text-es-green hover:bg-white transition-all shadow-lg"
          >
            Rejoindre à 19€/mois →
          </a>
          <p className="text-[10px] text-white/40 mt-5 max-w-lg mx-auto">
            * Tarif conservé tant que ton abonnement reste actif. En cas de désabonnement, tarif Standard 29€/mois à la reprise.
          </p>
        </div>
      </section>

      {/* 2 cartes tarifaires */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-es-text">Choisis ta formule</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {/* Carte Fondateur — 60% */}
            <div className="md:col-span-3 bg-es-terracotta rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <span className="relative inline-flex items-center bg-es-gold text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                RECOMMANDÉ
              </span>
              <h3 className="font-serif text-3xl font-bold mb-1 relative">FONDATEUR</h3>
              <p className="text-white/70 text-sm mb-6 relative">Les 500 premiers membres</p>
              <div className="text-5xl font-bold my-5 relative">
                19€<span className="text-lg font-normal text-white/60">/mois TTC</span>
              </div>
              <p className="text-white/70 text-sm mb-6 relative">à vie*</p>
              <a
                href={SKOOL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-full text-center font-semibold rounded-lg px-8 py-4 bg-white text-es-terracotta hover:bg-es-cream transition-all mb-8 shadow-md"
              >
                Rejoindre à 19€/mois
              </a>
              <ul className="space-y-3 relative">
                {[
                  "Tout le contenu ES Family (analyses, lives, ebooks, groupes, partenaires, simulateurs, fichiers)",
                  "Accès à tous les groupes thématiques",
                  "Badge « Membre fondateur » visible dans l'annuaire",
                  "Accès immédiat à la plateforme",
                  "Prix bloqué à vie*",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <svg className="w-5 h-5 text-es-gold mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-white/50 mt-6 relative">*Sous réserve d&apos;abonnement continu</p>
            </div>

            {/* Carte Standard — 40%, grisée */}
            <div className="md:col-span-2 bg-gray-100 rounded-2xl p-8 opacity-70 relative">
              <span className="inline-flex items-center bg-gray-300 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                STANDARD
              </span>
              <h3 className="font-serif text-2xl font-bold text-gray-500 mb-1">STANDARD</h3>
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

      {/* Bridge Academy — Tu veux les deux ? (split image/texte) */}
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
                Avec ES Academy, tu reçois <strong>3 mois d&apos;ES Family offerts</strong>. Tu apprends les fondamentaux sur 30h de formation et 60 outils, puis tu rejoins la communauté pour la suite.
                C&apos;est le duo le plus efficace pour passer de 0 à plusieurs biens.
              </p>
              <a
                href="/academy"
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

      {/* Témoignages */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Témoignages</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">La communauté en parle</h2>
          </div>
          <FamilyTestimonials />
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
      <MobileCta text="Rejoindre ES Family" href={SKOOL_URL} variant="terracotta" />
    </div>
  );
}
