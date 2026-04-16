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

      {/* Hero — Accroche émotionnelle */}
      <section className="py-20 lg:py-28 bg-es-cream">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-es-terracotta/10 px-5 py-2 text-sm font-medium text-es-terracotta mb-8">
            Communauté d&apos;investisseurs
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-es-text leading-tight mb-4">
            Ne restez plus seul(e) face à vos investissements
          </h1>
          <p className="text-xl text-es-text-muted max-w-2xl mx-auto mb-4 leading-relaxed">
            Rejoignez 500+ investisseurs qui s&apos;entraident au quotidien, partagent leurs deals et accèdent à des partenaires vérifiés.
          </p>
          <p className="text-lg font-bold text-es-terracotta mb-8">
            Pour le prix d&apos;un forfait téléphonique.
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
              Lives chaque semaine
            </span>
          </div>

          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-lg bg-es-terracotta text-white hover:bg-es-terracotta-dark transition-all"
          >
            Rejoindre ES Family — 19€/mois
          </a>
        </div>
      </section>

      {/* Douleurs → Transformation */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl font-bold text-es-text">Vous vous reconnaissez ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { before: "Seul(e) face à vos questions, personne à qui demander conseil", after: "Une communauté qui répond en 24h — vous n'êtes plus jamais seul(e)" },
              { before: "Noyé(e) dans les infos contradictoires sur Internet", after: "Des analyses pro triées chaque semaine par Emeline et son équipe" },
              { before: "Pas de réseau, pas de partenaires de confiance", after: "6 partenaires vérifiés + un annuaire de membres investisseurs" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="bg-red-50 rounded-xl p-5 mb-3">
                  <span className="text-2xl block mb-2">😩</span>
                  <p className="text-sm text-red-700">{item.before}</p>
                </div>
                <div className="text-es-terracotta text-xl mb-3">↓</div>
                <div className="bg-green-50 rounded-xl p-5">
                  <span className="text-2xl block mb-2">😊</span>
                  <p className="text-sm text-green-700 font-medium">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video placeholder */}
      <section className="py-12 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          {/* TODO: Replace with Loom embed */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-es-terracotta via-es-terracotta-dark to-es-terracotta shadow-lg cursor-pointer group">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-es-terracotta ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <p className="text-white font-medium text-lg">Découvrez l&apos;app ES Family en 2 min</p>
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

      {/* Ce que tu retrouves dans l'app — en bénéfices */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">L&apos;application</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tout ce dont tu as besoin, au même endroit</h2>
          </div>

          <div className="space-y-6">
            {/* Reste informé */}
            <div className="bg-es-cream rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📰</span>
                <h3 className="font-serif text-xl font-bold text-es-text">Reste informé(e) sans effort</h3>
              </div>
              <p className="text-sm text-es-text-muted mb-4 ml-10">Plus besoin de scroller 10 sites différents. Tout arrive chez toi, trié et analysé.</p>
              <div className="grid sm:grid-cols-3 gap-4 ml-10">
                {[
                  "Des actus immo, fiscalité et marché triées pour toi chaque semaine",
                  "Les sujets les plus importants remontent automatiquement",
                  "Challenge-toi chaque jour avec le quiz et gagne des points",
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-4">
                    <p className="text-sm text-es-text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pose tes questions */}
            <div className="bg-es-cream rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💬</span>
                <h3 className="font-serif text-xl font-bold text-es-text">Pose tes questions, obtiens des réponses</h3>
              </div>
              <p className="text-sm text-es-text-muted mb-4 ml-10">Fini de chercher seul(e). Pose ta question et des investisseurs expérimentés te répondent.</p>
              <div className="grid sm:grid-cols-2 gap-4 ml-10">
                <div className="bg-white rounded-xl p-5">
                  <p className="font-medium text-es-text text-sm mb-2">Groupes thématiques</p>
                  <div className="flex flex-wrap gap-2">
                    {["LMNP", "Colocation", "SCI", "Travaux", "Fiscalité", "Airbnb", "SCPI"].map((g) => (
                      <span key={g} className="px-3 py-1 bg-es-green/10 text-es-green rounded-full text-xs font-medium">{g}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5">
                  <p className="font-medium text-es-text text-sm mb-2">Une communauté vivante</p>
                  <p className="text-xs text-es-text-muted">Réagis, sauvegarde les meilleurs posts, construis ton réseau d&apos;investisseurs</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["👍", "❤️", "🔥", "💡", "👏", "🎉"].map((e) => (
                      <span key={e} className="w-8 h-8 bg-es-cream rounded-full flex items-center justify-center text-sm">{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Apprends des meilleurs */}
              <div className="bg-es-cream rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎙</span>
                  <h3 className="font-serif text-lg font-bold text-es-text">Apprends des meilleurs chaque semaine</h3>
                </div>
                <ul className="space-y-2 mt-3">
                  {[
                    "Lives hebdo avec Emeline et ses partenaires (fiscaliste, expert-comptable, décoratrice, artisan)",
                    "Tous les replays accessibles à vie",
                    "Challenges concrets pour avancer pas à pas",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-es-text-muted">
                      <span className="text-es-terracotta mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outils pro */}
              <div className="bg-es-cream rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📦</span>
                  <h3 className="font-serif text-lg font-bold text-es-text">Des outils pro à portée de main</h3>
                </div>
                <ul className="space-y-2 mt-3">
                  {[
                    "4 simulateurs intégrés (notaire, rendement, cashflow, emprunt)",
                    "34 fichiers pratiques classés par thème",
                    "Le podcast Out of the Box en accès direct",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-es-text-muted">
                      <span className="text-es-terracotta mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Partenaires & bons plans */}
              <div className="bg-es-cream rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💎</span>
                  <h3 className="font-serif text-lg font-bold text-es-text">Des partenaires et bons plans exclusifs</h3>
                </div>
                <ul className="space-y-2 mt-3">
                  {[
                    "6 partenaires vérifiés avec codes promo réservés aux membres",
                    "Bons plans matériaux et travaux négociés",
                    "Coaching accessible (appel découverte gratuit)",
                    "Parrainage : offre 1 mois gratuit à un ami",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-es-text-muted">
                      <span className="text-es-terracotta mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progresse */}
              <div className="bg-es-cream rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-serif text-lg font-bold text-es-text">Progresse et fais-toi remarquer</h3>
                </div>
                <p className="text-sm text-es-text-muted mt-2 mb-3">Gagne des badges à chaque action et monte dans le classement de la communauté.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["✍️ Premier post", "❤️ 10 likes", "🔥 100 likes", "💎 500 likes"].map((b) => (
                    <span key={b} className="px-2 py-1 bg-white rounded-full text-[11px] text-es-text-muted">{b}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {["🥉 Bronze", "🥈 Silver", "🥇 Gold", "🏅 Top Membre"].map((m) => (
                    <span key={m} className="px-2 py-1 bg-es-gold/10 rounded-full text-[11px] text-es-gold-dark font-medium">{m}</span>
                  ))}
                </div>
              </div>
            </div>
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
