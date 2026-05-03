"use client";

import { useState } from "react";

const C = {
  ivoire: "#FFF8EB",
  creme: "#FAF1DC",
  parchemin: "#F5E9CD",
  vertSapin: "#1F3320",
  vertSapinSoft: "#2F4A30",
  bordeaux: "#6B1F2E",
  bordeauxClair: "#933343",
  or: "#C8941D",
  orChaud: "#E5B95E",
  orPale: "#F4D89A",
  encre: "#2D2418",
  encreSoft: "#5C4F3E",
  encreClair: "#8A7D6A",
};

const PHOTOS = {
  bokehLights:
    "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=1800&q=85&auto=format&fit=crop",
  tableFestive:
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1800&q=85&auto=format&fit=crop",
};

const JOURS_PREVIEW = [
  {
    num: 1,
    libelle: "Le coup d'envoi",
    date: "Lun 1er decembre",
    teaser:
      "Les 24 promesses du calendrier, et un premier outil pour entrer dans le rituel.",
    accent: C.bordeaux,
  },
  {
    num: 7,
    libelle: "Bilan immo 2026",
    date: "Dim 7 decembre",
    teaser:
      "Le tableur de l'annee : encaisse, paye, optimise. En 15 minutes, tu sais ou tu en es.",
    accent: C.vertSapin,
  },
  {
    num: 12,
    libelle: "Reveillon strategique",
    date: "Ven 12 decembre",
    teaser:
      "Les 3 questions a te poser autour du sapin pour viser 2027 sans rever en l'air.",
    accent: C.bordeaux,
  },
  {
    num: 18,
    libelle: "Plan d'attaque 2027",
    date: "Jeu 18 decembre",
    teaser:
      "Le canevas exact : objectifs chiffres, biens cibles, deadlines, banque.",
    accent: C.vertSapin,
  },
  {
    num: 24,
    libelle: "Cadeau de la veille",
    date: "Mer 24 decembre",
    teaser:
      "Un bonus premium reserve aux abonnes du calendrier. Surprise gardee jalousement.",
    accent: C.or,
  },
];

const POUR_QUI = [
  {
    label: "Bilan",
    titre: "Tu veux finir 2026 lucide",
    body: "Sans culpabilite, sans course de fin d'annee. Juste un bilan clair de ou tu en es vraiment, en patrimoine et en strategie.",
  },
  {
    label: "Plan",
    titre: "Tu prepares 2027 maintenant",
    body: "Pas en fevrier dans le rush. Pendant la treve hivernale, en douceur, avec un plan ecrit que tu peux signer.",
  },
  {
    label: "Rituel",
    titre: "Tu kiffes les rituels chauds",
    body: "Un mail court chaque matin, a lire avec ton cafe ou ton chocolat. Format intimiste, pas un cours magistral.",
  },
];

const FAQ_DATA = [
  {
    q: "C'est gratuit, vraiment ?",
    a: "Oui, 100%. Le calendrier de l'Avent est mon cadeau de Noel a la communaute Academy. Aucun paiement, aucune CB demandee, juste ton mail pour recevoir les 24 cases.",
  },
  {
    q: "Combien de mails par jour ?",
    a: "Un seul email court (3 a 4 minutes de lecture max) chaque matin du 1er au 24 decembre. Pas de spam, pas de relance, pas de pression.",
  },
  {
    q: "Et si je m'inscris en cours de route ?",
    a: "Tu recevras les emails restants a partir de ton inscription, et l'archive des emails passes en un seul mail recap. Tu ne rates rien.",
  },
  {
    q: "C'est quoi le cadeau du 24 ?",
    a: "Un bonus premium reserve aux abonnes du calendrier. Je ne le revele pas ici, sinon ca casse la surprise. Mais ca vaut largement les 24 jours d'attente, parole.",
  },
  {
    q: "Je peux me desinscrire ?",
    a: "En 1 clic depuis n'importe quel email. Et tu peux meme ne lire que les jours qui te parlent : le calendrier reste a ton rythme.",
  },
  {
    q: "C'est pour quel niveau ?",
    a: "Du futur premier achat au proprio de 10 lots. Le calendrier alterne basique et avance, et chaque case marque son niveau (debutant / confirme / expert) pour que tu choisisses ce qui te parle.",
  },
];

export default function CalendrierAventPage() {
  return (
    <main
      className="font-body relative"
      style={{ background: C.ivoire, color: C.encre, minHeight: "100vh" }}
    >
      <FontsAndStyles />
      <Hero />
      <BarrePreuve />
      <PortesCalendrier />
      <PourQuiSi />
      <Storytelling />
      <Temoignages />
      <SectionFinaleOptIn />
      <FAQList />
      <Footer />
    </main>
  );
}

// ============================================================================
// FONTS + ANIMATIONS GLOBALES
// ============================================================================

function FontsAndStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,300;1,500;1,700&family=Inter:wght@300;400;500;600&display=swap");

      .font-display { font-family: "Fraunces", serif; font-feature-settings: "ss01"; }
      .font-italic-display { font-family: "Cormorant Garamond", serif; font-style: italic; }
      .font-body { font-family: "Inter", sans-serif; }

      @keyframes fade-up {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes warm-pulse {
        0%, 100% { box-shadow: 0 8px 32px ${C.bordeaux}33; }
        50% { box-shadow: 0 12px 48px ${C.bordeaux}55, 0 0 24px ${C.or}44; }
      }
      @keyframes slow-zoom {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      @keyframes shimmer-gold {
        0%, 100% { color: ${C.or}; }
        50% { color: ${C.orChaud}; }
      }

      .animate-fade-up { animation: fade-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
      .animate-warm-pulse { animation: warm-pulse 4s ease-in-out infinite; }
      .animate-slow-zoom { animation: slow-zoom 20s ease-in-out infinite; }
      .animate-shimmer-gold { animation: shimmer-gold 3s ease-in-out infinite; }

      .gold-line {
        background: linear-gradient(90deg, transparent, ${C.or}, transparent);
        height: 1px;
      }
      .gold-line-thick {
        background: linear-gradient(90deg, transparent, ${C.or}, transparent);
        height: 2px;
      }

      .num-romain {
        font-family: "Fraunces", serif;
        font-weight: 300;
        font-style: italic;
        line-height: 0.85;
        letter-spacing: -0.04em;
      }

      .num-romain-or {
        background: linear-gradient(135deg, ${C.orChaud} 0%, ${C.or} 50%, ${C.bordeaux} 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: none;
      }

      .ornement-baroque {
        display: inline-block;
        width: 100%;
        height: 24px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 24' preserveAspectRatio='xMidYMid meet'><g fill='none' stroke='%23C8941D' stroke-width='1.2' stroke-linecap='round'><path d='M 0 12 L 60 12'/><path d='M 60 12 Q 65 5 70 12 Q 75 19 80 12'/><circle cx='100' cy='12' r='3' fill='%23C8941D'/><path d='M 95 12 Q 100 6 105 12'/><path d='M 95 12 Q 100 18 105 12'/><circle cx='100' cy='12' r='1.5' fill='%23FFF8EB'/><path d='M 120 12 Q 125 5 130 12 Q 135 19 140 12'/><path d='M 140 12 L 200 12'/></g></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
      }

      .volute-or {
        width: 80px;
        height: 24px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 24'><g fill='none' stroke='%23C8941D' stroke-width='1.2' stroke-linecap='round'><path d='M 5 12 Q 15 4 25 12 Q 30 18 40 12 Q 50 4 60 12 Q 65 18 75 12'/><circle cx='40' cy='12' r='1.8' fill='%23C8941D'/></g></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        display: inline-block;
      }

      .corner-deco {
        position: absolute;
        width: 60px;
        height: 60px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><g fill='none' stroke='%23C8941D' stroke-width='1' stroke-linecap='round'><path d='M 8 8 L 24 8'/><path d='M 8 8 L 8 24'/><path d='M 8 24 Q 14 18 24 8'/><circle cx='8' cy='8' r='2' fill='%23C8941D'/><path d='M 30 8 Q 36 14 30 20'/><path d='M 8 30 Q 14 36 20 30'/></g></svg>");
        background-repeat: no-repeat;
      }

      .case-card {
        background: linear-gradient(180deg, ${C.creme} 0%, ${C.parchemin} 100%);
        border: 1px solid ${C.or}66;
        box-shadow: 0 12px 40px ${C.encre}11, inset 0 1px 0 #ffffff66;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
      }
      .case-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 50px ${C.encre}22, 0 0 30px ${C.or}55;
      }

      .quote-mark-warm {
        font-family: "Cormorant Garamond", serif;
        color: ${C.bordeaux};
        opacity: 0.3;
        line-height: 0;
      }

      .dropcap::first-letter {
        font-family: "Fraunces", serif;
        font-weight: 700;
        font-size: 4.2em;
        line-height: 0.8;
        float: left;
        margin: 0.06em 0.12em 0 0;
        color: ${C.bordeaux};
        font-style: italic;
      }
    `}</style>
  );
}

// ============================================================================
// HERO : photo bokeh lights cover (gardée)
// ============================================================================

function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={PHOTOS.bokehLights}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${C.encre}aa 0%, ${C.encre}55 50%, ${C.encre}99 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center text-white animate-fade-up">
        <p
          className="text-xs uppercase tracking-[0.4em] mb-6 font-medium"
          style={{ color: C.orChaud, textShadow: `0 2px 16px ${C.encre}cc` }}
        >
          Edition 2026 · Du 1er au 24 decembre
        </p>

        <h1 className="font-display font-light leading-[0.92] mb-8">
          <span
            className="block text-6xl sm:text-8xl lg:text-9xl"
            style={{ color: "#fff", textShadow: `0 4px 32px ${C.encre}` }}
          >
            Calendrier
          </span>
          <span
            className="block font-italic-display text-4xl sm:text-6xl lg:text-7xl mt-2 italic"
            style={{ color: C.orChaud, textShadow: `0 2px 24px ${C.encre}` }}
          >
            de l&apos;Avent
          </span>
          <span
            className="block text-2xl sm:text-3xl lg:text-4xl mt-4 font-light tracking-widest uppercase"
            style={{ color: C.orPale, opacity: 0.95, textShadow: `0 2px 16px ${C.encre}` }}
          >
            de l&apos;investisseur
          </span>
        </h1>

        <div className="gold-line-thick max-w-xs mx-auto mb-8" />

        <p
          className="text-xl sm:text-2xl mb-4 font-light leading-relaxed"
          style={{ color: "#fff", textShadow: `0 2px 16px ${C.encre}cc` }}
        >
          24 jours, 24 cadeaux a ouvrir dans ta boite mail.
        </p>
        <p
          className="font-italic-display italic text-lg sm:text-xl mb-12"
          style={{ color: C.orChaud, textShadow: `0 2px 12px ${C.encre}` }}
        >
          Pour faire le bilan 2026 et poser le plan 2027 en douceur.
        </p>

        <a
          href="#form-avent"
          className="inline-block font-display text-base font-medium py-4 px-10 rounded-md transition hover:scale-105 animate-warm-pulse"
          style={{
            background: C.bordeaux,
            color: C.creme,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: `1px solid ${C.or}`,
          }}
        >
          Reserver ma place
        </a>

        <p className="text-xs mt-6 uppercase tracking-wider" style={{ color: C.orPale, opacity: 0.85 }}>
          Gratuit · Sans CB · Desinscription en 1 clic
        </p>
      </div>

      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white opacity-70 text-sm font-italic-display italic"
        style={{ textShadow: `0 2px 12px ${C.encre}` }}
      >
        Decouvre les 24 portes ↓
      </div>
    </section>
  );
}

// ============================================================================
// BARRE PREUVE : bloc plein vert sapin avec ornements baroques + chiffres XXL
// ============================================================================

function BarrePreuve() {
  return (
    <section
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: C.vertSapin, color: C.creme }}
    >
      {/* Ornement baroque centré */}
      <div className="max-w-md mx-auto mb-10">
        <div className="ornement-baroque" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <p
          className="text-xs uppercase tracking-[0.4em] mb-12"
          style={{ color: C.orChaud }}
        >
          Edition 2025 en chiffres
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <p
              className="font-display text-7xl sm:text-8xl font-light leading-none animate-shimmer-gold"
            >
              4 200
            </p>
            <p className="text-sm mt-4 opacity-90 leading-relaxed font-light tracking-wide">
              investisseurs ont suivi le calendrier
            </p>
          </div>
          <div>
            <p
              className="font-display text-7xl sm:text-8xl font-light leading-none animate-shimmer-gold"
              style={{ animationDelay: "0.5s" }}
            >
              78<span className="text-5xl">%</span>
            </p>
            <p className="text-sm mt-4 opacity-90 leading-relaxed font-light tracking-wide">
              l&apos;ont termine jusqu&apos;a la case du 24
            </p>
          </div>
          <div>
            <p
              className="font-display text-7xl sm:text-8xl font-light leading-none animate-shimmer-gold"
              style={{ animationDelay: "1s" }}
            >
              4,8<span className="text-4xl">/5</span>
            </p>
            <p className="text-sm mt-4 opacity-90 leading-relaxed font-light tracking-wide">
              de note moyenne sur les 24 jours
            </p>
          </div>
        </div>
      </div>

      {/* Ornement baroque centré */}
      <div className="max-w-md mx-auto mt-12">
        <div className="ornement-baroque" />
      </div>
    </section>
  );
}

// ============================================================================
// PORTES DU CALENDRIER : 5 cards avec NUMERO ROMAIN XXL doré
// ============================================================================

function PortesCalendrier() {
  return (
    <section className="relative py-24 px-6" style={{ background: C.ivoire }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: C.bordeaux }}
          >
            Quelques portes a ouvrir
          </p>
          <h2
            className="font-display text-4xl sm:text-6xl font-light"
            style={{ color: C.encre }}
          >
            5 cases sur 24
          </h2>
          <p
            className="font-italic-display italic text-lg max-w-xl mx-auto mt-4"
            style={{ color: C.encreSoft }}
          >
            Pas de spoiler sur les 19 autres. La surprise fait partie du cadeau.
          </p>
          <div className="volute-or mt-8 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {JOURS_PREVIEW.map((j) => (
            <article
              key={j.num}
              className="case-card relative rounded-xl overflow-hidden"
            >
              {/* En-tete couleur avec numero arabe XXL en doré sur fond accent */}
              <div
                className="px-5 pt-6 pb-4 relative"
                style={{
                  background: `linear-gradient(180deg, ${j.accent} 0%, ${j.accent}dd 100%)`,
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.orPale, opacity: 0.9 }}
                  >
                    {j.date}
                  </p>
                  <span
                    className="font-display text-5xl sm:text-6xl font-light leading-none"
                    style={{ color: C.orChaud }}
                  >
                    {j.num}
                  </span>
                </div>
              </div>

              {/* Corps */}
              <div className="p-5 pt-4">
                <h3
                  className="font-display text-lg font-medium leading-tight mb-3"
                  style={{ color: C.encre }}
                >
                  {j.libelle}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.encreSoft }}>
                  {j.teaser}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p
          className="text-center mt-16 font-italic-display italic text-xl"
          style={{ color: C.bordeaux }}
        >
          ... et 19 autres portes a ouvrir, une chaque matin.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// POUR QUI SI : 3 cards crème avec gros chiffres romains italiques
// ============================================================================

function PourQuiSi() {
  return (
    <section className="py-24 px-6 relative" style={{ background: C.creme }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: C.vertSapin }}
          >
            Pour qui
          </p>
          <h2
            className="font-display text-4xl sm:text-6xl font-light"
            style={{ color: C.encre }}
          >
            Ce calendrier est fait pour toi{" "}
            <span className="font-italic-display italic" style={{ color: C.bordeaux }}>
              si
            </span>
          </h2>
          <div className="volute-or mt-6 mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {POUR_QUI.map((p, i) => (
            <article
              key={i}
              className="case-card rounded-xl p-8 relative text-center"
            >
              <p
                className="font-italic-display italic text-5xl sm:text-6xl font-light leading-none mb-3 num-romain-or"
              >
                {p.label}
              </p>
              <div className="gold-line max-w-[60px] mx-auto mb-5" />
              <h3
                className="font-display text-2xl font-medium mb-3 leading-tight"
                style={{ color: C.bordeaux }}
              >
                {p.titre}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: C.encreSoft }}>
                {p.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STORYTELLING : bloc bordeaux dominant + dropcap éditorial
// ============================================================================

function Storytelling() {
  return (
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: C.bordeaux, color: C.creme }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="ornement-baroque max-w-md mx-auto mb-8" />
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: C.orChaud }}
          >
            Petite histoire vraie
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-light leading-tight">
            Decembre, c&apos;est la fenetre rare
            <span className="font-italic-display italic block mt-1" style={{ color: C.orChaud }}>
              pour decider de 2027
            </span>
          </h2>
        </div>

        <div className="space-y-6 text-base sm:text-lg leading-relaxed font-light">
          <p className="dropcap">
            Tu connais l&apos;ambiance de janvier. Tu te dis :{" "}
            <span className="font-italic-display italic" style={{ color: C.orChaud }}>
              cette annee, c&apos;est la bonne, j&apos;achete un bien
            </span>
            . Et puis fevrier passe. Mars file. La banque te demande des trucs que tu n&apos;as pas. Le bien que tu visais part chez quelqu&apos;un d&apos;autre.
          </p>
          <p>
            La verite, c&apos;est que les decisions immo se prennent{" "}
            <strong style={{ color: C.orChaud }}>en decembre, pas en janvier</strong>
            . Pendant la treve, quand tu as enfin du temps, que la pression baisse, que tu peux poser ton bilan a tete reposee.
          </p>
          <p
            className="font-italic-display italic text-2xl sm:text-3xl text-center pt-8"
            style={{ color: C.orChaud }}
          >
            Le 24 au soir, tu sais ce que tu fais en 2027.
            <br />
            <span className="text-orPale">Et tu as un plan ecrit pour le faire.</span>
          </p>
        </div>

        <div className="ornement-baroque max-w-md mx-auto mt-12" />
      </div>
    </section>
  );
}

// ============================================================================
// TEMOIGNAGES : cards parchemin avec citation + signature
// ============================================================================

function Temoignages() {
  const temoignages = [
    {
      texte:
        "J'ai fait mes premieres simulations bancaires entre la dinde et la buche. Resultat : signature d'un T2 a Lille le 15 janvier. Sans ce calendrier, j'aurais encore procrastine 6 mois.",
      auteur: "Camille, 31 ans",
      ville: "Lille",
    },
    {
      texte:
        "Le mail du 12 m'a fait reviser tout mon plan 2026. Au lieu d'acheter un 3e bien, j'ai consolide mon T3 et j'ai baisse mon prelevement IR de 1900 euros sur l'annee.",
      auteur: "Antoine, 38 ans",
      ville: "Toulouse",
    },
    {
      texte:
        "Pas tres team Noel a la base, mais ce calendrier-la, je l'attends maintenant chaque annee. C'est devenu mon rituel de bilan/projection.",
      auteur: "Sandra, 44 ans",
      ville: "Nantes",
    },
  ];

  return (
    <section className="py-24 px-6" style={{ background: C.parchemin }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: C.vertSapin }}
          >
            Edition 2025
          </p>
          <h2
            className="font-display text-3xl sm:text-5xl font-light"
            style={{ color: C.encre }}
          >
            Ils ont suivi, voici ce qu&apos;ils en disent
          </h2>
          <div className="volute-or mt-6 mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {temoignages.map((t, i) => (
            <figure
              key={i}
              className="rounded-xl p-7 relative"
              style={{
                background: C.creme,
                border: `1px solid ${C.or}66`,
                boxShadow: `0 8px 24px ${C.encre}11`,
              }}
            >
              <div className="quote-mark-warm text-7xl absolute top-3 left-4">&ldquo;</div>
              <blockquote
                className="font-italic-display italic text-base leading-relaxed pt-6 mb-4"
                style={{ color: C.encre }}
              >
                {t.texte}
              </blockquote>
              <figcaption className="border-t pt-3" style={{ borderColor: `${C.or}33` }}>
                <p className="font-display text-sm font-medium" style={{ color: C.bordeaux }}>
                  {t.auteur}
                </p>
                <p className="text-xs uppercase tracking-wider mt-1" style={{ color: C.encreClair }}>
                  {t.ville}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION FINALE OPT-IN : photo table festive (gardée)
// ============================================================================

function SectionFinaleOptIn() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" id="form-avent">
      <div className="absolute inset-0">
        <img
          src={PHOTOS.tableFestive}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${C.bordeaux}dd 0%, ${C.bordeaux}aa 100%)`,
          }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto text-center" style={{ color: C.creme }}>
        <p className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: C.orChaud }}>
          Reservation ouverte
        </p>
        <h2 className="font-display text-4xl sm:text-6xl font-light leading-tight mb-6">
          24 cases.
          <span className="font-italic-display italic block mt-2" style={{ color: C.orChaud }}>
            1 plan pour 2027.
          </span>
        </h2>
        <p className="text-lg mb-12 opacity-95 font-light leading-relaxed">
          Inscris-toi maintenant. Le 1er decembre au matin, tu recevras la 1ere case du calendrier dans ta boite mail.
        </p>

        <div
          className="rounded-2xl p-8 sm:p-10 animate-warm-pulse"
          style={{ background: C.creme, border: `1px solid ${C.or}` }}
        >
          <FormulaireOptIn />
        </div>

        <p className="text-xs mt-6 uppercase tracking-wider opacity-80">
          Pas de carte bancaire · Desinscription en 1 clic
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ
// ============================================================================

function FAQList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 px-6" style={{ background: C.ivoire }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{ color: C.bordeaux }}
          >
            Questions frequentes
          </p>
          <h2
            className="font-display text-3xl sm:text-5xl font-light"
            style={{ color: C.encre }}
          >
            Tu te demandes peut-etre
          </h2>
          <div className="volute-or mt-6 mx-auto" />
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left rounded-xl p-5 transition"
                style={{
                  background: isOpen ? C.parchemin : C.creme,
                  border: `1px solid ${isOpen ? C.bordeaux + "88" : C.or + "33"}`,
                  boxShadow: isOpen
                    ? `0 8px 20px ${C.bordeaux}22`
                    : `0 4px 12px ${C.encre}11`,
                  color: C.encre,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="font-display text-lg font-medium flex-1 leading-snug"
                    style={{ color: isOpen ? C.bordeaux : C.encre }}
                  >
                    {item.q}
                  </span>
                  <span
                    className="text-2xl font-light transition-transform shrink-0"
                    style={{
                      color: C.bordeaux,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}
                  >
                    +
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: C.encreSoft }}>
                    {item.a}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER : bloc vert sapin sobre + ornement
// ============================================================================

function Footer() {
  return (
    <footer
      className="py-16 px-6"
      style={{ background: C.vertSapin, color: C.creme }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div className="ornement-baroque max-w-xs mx-auto mb-6" />
        <p
          className="font-italic-display italic text-3xl mb-2"
          style={{ color: C.orChaud }}
        >
          A tres vite sur la 1ere case
        </p>
        <p className="text-sm font-light opacity-80 mb-6">Edition 2026 · 1er au 24 decembre</p>
        <div className="ornement-baroque max-w-xs mx-auto mb-6" />
        <p className="text-xs opacity-60">
          ES Academy · Holdem SASU · RCS Nanterre 920244563 ·{" "}
          <a href="/cgv" className="underline">
            CGU
          </a>{" "}
          ·{" "}
          <a href="/mentions-legales" className="underline">
            Mentions legales
          </a>
        </p>
      </div>
    </footer>
  );
}

// ============================================================================
// FORM OPT-IN
// ============================================================================

function FormulaireOptIn() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !email.trim() || !consent) {
      setError("Remplis ton prenom, ton email et coche le consentement.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/forms/calendrier-avent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          phone: phone.trim() || undefined,
          consent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur, reessaie dans 1 minute.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Erreur reseau, reessaie dans 1 minute.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-left" style={{ color: C.encre }}>
        <p
          className="font-display text-2xl font-medium mb-2"
          style={{ color: C.bordeaux }}
        >
          Inscription confirmee
        </p>
        <p className="text-sm leading-relaxed">
          Le 1er decembre au matin, tu recevras la 1ere case du calendrier dans ta boite mail.
        </p>
        <p className="text-xs mt-3 opacity-80">
          D&apos;ici la, ajoute <strong>emeline@emeline-siron.fr</strong> a tes contacts pour ne rien rater.
        </p>
      </div>
    );
  }

  return (
    <form
      id="form-avent-inner"
      onSubmit={handleSubmit}
      className="max-w-md mx-auto space-y-3 text-left"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Ton prenom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-3 rounded-md font-body text-sm"
          style={{ background: "#fff", border: `1px solid ${C.or}66`, color: C.encre }}
          required
        />
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-md font-body text-sm"
          style={{ background: "#fff", border: `1px solid ${C.or}66`, color: C.encre }}
          required
        />
      </div>
      <input
        type="tel"
        placeholder="Telephone (optionnel)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-3 rounded-md font-body text-sm"
        style={{ background: "#fff", border: `1px solid ${C.or}66`, color: C.encre }}
      />
      <label
        className="flex items-start gap-2 text-xs leading-relaxed"
        style={{ color: C.encreSoft }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 accent-amber-700"
          required
        />
        <span>
          J&apos;accepte de recevoir les emails du calendrier et les news Emeline. Desinscription en 1 clic a tout moment.
        </span>
      </label>

      {error && (
        <p className="text-xs font-medium" style={{ color: C.bordeauxClair }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full font-display text-base font-medium py-3 px-6 rounded-md transition disabled:opacity-50 hover:opacity-95"
        style={{
          background: C.bordeaux,
          color: C.creme,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          boxShadow: `0 6px 16px ${C.bordeaux}66`,
        }}
      >
        {submitting ? "Inscription en cours..." : "Reserver ma place"}
      </button>

      <p
        className="text-xs text-center font-light tracking-wider uppercase"
        style={{ color: C.encreClair }}
      >
        1 mail par jour · Du 1er au 24 decembre
      </p>
    </form>
  );
}
