import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

import enfanceBrouette from "../../../public/images/site/06-enfance-origines/enfance-01-brouette-chantier-campagne.jpeg";
import avantApresCles from "../../../public/images/site/02-patrimoine-cles/patrimoine-03-avant-apres-2019-2022.jpg";
import chantierMasse from "../../../public/images/site/01-chantier-action/chantier-02-masse-parpaings.jpeg";
import chantierMarteau from "../../../public/images/site/01-chantier-action/chantier-03-marteau-lunettes-mur.jpeg";
import chantierMasque from "../../../public/images/site/01-chantier-action/chantier-06-masque-poussiere-portrait.jpeg";
import pivotDemission from "../../../public/images/site/03-pivot-moments-cles/pivot-01-demission-story-fev-2022.jpg";
import bebeMicroPodcast from "../../../public/images/site/05-incarnation-actuelle/incarnation-01-bebe-micro-podcast.jpeg";
import deuxTrousseauxCles from "../../../public/images/site/02-patrimoine-cles/patrimoine-01-deux-trousseaux-cles.jpg";

export const metadata: Metadata = buildMetadata({
  title: "Qui est Emeline Siron ? De fille de garagiste à investisseuse avec 55 locataires",
  description: "Parcours, échecs, victoires. De l'enfance dans un garage auto à la construction d'un patrimoine de 12 biens immobiliers et d'un écosystème d'accompagnement à l'investissement.",
  path: "/a-propos",
  // TODO: remplacer par image OG dédiée [TODO_OG_IMAGE_A_PROPOS] quand dispo
  image: "/images/site/06-enfance-origines/enfance-01-brouette-chantier-campagne.jpeg",
});

// TODO: URL Solstice Patrimoine à confirmer [TODO_URL_SOLSTICE_PATRIMOINE]
const SOLSTICE_URL = "https://solstice-patrimoine.fr";

type ChapterImageFull = {
  type: "full";
  src: import("next/image").StaticImageData;
  alt: string;
};
type ChapterImageSinglePortrait = {
  type: "single-portrait";
  src: import("next/image").StaticImageData;
  alt: string;
};
type ChapterImageMosaic = {
  type: "mosaic";
  items: { src: import("next/image").StaticImageData; alt: string }[];
};
type ChapterImageMosaicPlusFeature = {
  type: "mosaic-plus-feature";
  items: { src: import("next/image").StaticImageData; alt: string }[];
  feature: { src: import("next/image").StaticImageData; alt: string };
};
type ChapterPlaceholder = {
  type: "placeholder";
  label: string;
};
type ChapterMedia = ChapterImageFull | ChapterImageSinglePortrait | ChapterImageMosaic | ChapterImageMosaicPlusFeature | ChapterPlaceholder;

interface Chapter {
  id: string;
  year: string;
  title: string;
  content: string[];
  media?: ChapterMedia;
  pivot?: boolean;
}

const chapters: Chapter[] = [
  {
    id: "debut",
    year: "Avant tout",
    title: "Fille de garagiste, Val-d'Oise",
    content: [
      "Parents commerçants, enfance sans bowling ni sorties au parc. J'ai grandi dans un garage auto, à bricoler avec mon père. J'ai toujours aimé les activités manuelles.",
      "Mes week-ends, je les passais sur le chantier de la maison que mes parents avaient achetée. 24 ans de travaux. C'est là que j'ai appris à ne jamais avoir peur d'un chantier.",
      "J'étais cette bonne élève qui se reposait sur ses acquis. J'ai loupé mon bac à 3 points près. Premier vrai échec de ma vie. Leçon retenue : le talent seul ne suffit pas.",
    ],
    media: {
      type: "full",
      src: enfanceBrouette,
      alt: "Emeline enfant, brouette à la main, dans la campagne familiale",
    },
  },
  {
    id: "parcours-pro",
    year: "2008–2019",
    title: "Le parcours classique et les burnouts",
    content: [
      "BTS, licence, master en gestion de patrimoine immobilier. Puis 2 ans en alternance dans une société de gestion immo de centres commerciaux : deux burnouts avant 25 ans. L'ambiance était pourrie, 19 personnes sont parties en 6 mois. J'ai vécu un enfer professionnel.",
      "Intérim, société d'assurance, et la dernière, une société de gestion de fonds d'investissements : 3 ans à gérer 250 millions d'euros d'immobilier de santé en Europe (EHPAD, dialyse, psychiatrie). Je passais ma vie sur les chantiers. J'adorais ça. J'avais un job extra.",
      "J'étais toujours pas à ma place, je le savais... mais j'avais un job génial.",
    ],
  },
  {
    id: "declic",
    year: "2020",
    title: "Le déclic",
    content: [
      "Je vis une relation toxique avec un pervers narcissique. Je sombre. Il me géolocalise au quotidien. Je n'ai plus confiance en moi. Je vis un enfer. Je passe mon temps à pleurer, un mal-être en continu.",
      "Puis un jour, une amie me propose de visiter un bien avec elle. Déclic total.",
      "En 2 semaines, j'ai signé 2 compromis pour 15 studios. J'ai appliqué ce que je savais faire pour les fonds : business plans, tableaux, négociation. Mon premier immeuble de 8 appartements a généré +1 300€ de cash-flow mensuel dès le premier mois.",
    ],
  },
  {
    id: "enchainement",
    year: "2020–2022",
    title: "L'enchaînement",
    content: [
      "En 18 mois : 2 colocations, une maison divisée en 4 studios, un coliving de 8 chambres. J'ai même aidé mon artisan à monter sa boîte avec une équipe de 8 personnes.",
      "Parallèlement, mon Instagram explose. Je montre ce que je fais au quotidien, sur chantier et dans ma vie professionnelle.",
      "Je me retrouve à devoir prendre une décision. Je n'arrive plus à gérer mes 2 vies, pro et perso : elles prennent trop d'ampleur.",
    ],
    media: {
      type: "mosaic-plus-feature",
      items: [
        { src: chantierMasse, alt: "Emeline avec une masse sur un chantier" },
        { src: chantierMarteau, alt: "Emeline avec marteau et lunettes de protection" },
        { src: chantierMasque, alt: "Emeline avec un masque de poussière sur un chantier" },
      ],
      feature: {
        src: avantApresCles,
        alt: "Avant/après : 2 clés en 2019, un tas de clés en 2022",
      },
    },
  },
  {
    id: "demission",
    year: "Février 2022",
    title: "La démission",
    pivot: true,
    content: [
      "Février 2022, je démissionne définitivement. J'étais à 15 000€ de loyer facturé par mois.",
      "Fin d'un cycle. Début d'autre chose.",
    ],
    media: {
      type: "single-portrait",
      src: pivotDemission,
      alt: "Story Instagram du 28 février 2022 : annonce de la démission d'Emeline Siron",
    },
  },
  {
    id: "premieres-annees",
    year: "2022–2025",
    title: "Les premières années d'entrepreneuriat",
    content: [
      "8 mai 2022, je cofonde Evermind Formation. Lancement : 80 ventes en 3 jours. En 6 mois, l'équipe passe de 2 à 8 personnes. 1 900 élèves formés en 3 ans.",
      "Une aventure structurante qui m'a préparée à construire ce que je lance en 2026.",
    ],
  },
];

export default function QuiEstEmeline() {
  return (
    <div className="min-h-screen">
      <Header />
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Qui est Emeline ?", url: `${SITE_URL}/a-propos` },
      ])} />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Mon histoire, sans filtre</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-4 mb-6 leading-[1.1]">
            Je n&apos;étais pas faite pour ça.<br className="hidden sm:inline" />{" "}
            <span className="text-es-gold">J&apos;ai tout construit quand même.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Parents commerçants, enfance dans un garage auto, bac raté à 3 points près, deux burnouts.
            Puis 55 locataires et 1 900 élèves formés. Voici ce qui s&apos;est passé entre les deux.
            Et pourquoi je suis persuadée que tu peux le faire aussi.
          </p>
        </div>
      </section>

      {/* Stats — Patrimoine immobilier */}
      <section className="py-16 bg-es-green">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: "55", label: "locataires" },
            { value: "12", label: "biens immobiliers" },
            { value: "260 000€", label: "de loyers annuels" },
            { value: "1 900", label: "investisseurs formés" },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-es-gold">{stat.value}</div>
                <div className="text-sm text-white/60 mt-2">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Timeline narrative */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">L&apos;histoire complète</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tout a commencé dans un garage</h2>
          </div>

          <div className="space-y-12">
            {chapters.map((chapter, i) => (
              <div key={chapter.id}>
                {chapter.pivot && (
                  <ScrollReveal delay={i * 50}>
                    <div className="mb-6 text-center">
                      <span className="inline-block px-4 py-1 rounded-full bg-es-terracotta text-white text-xs font-bold uppercase tracking-widest">
                        Le moment pivot
                      </span>
                    </div>
                  </ScrollReveal>
                )}
                <ScrollReveal delay={i * 50}>
                  <article className="relative pl-8 border-l-2 border-es-green/20">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-es-green border-4 border-es-cream" />
                    <div className="mb-2">
                      <span className="text-xs text-es-terracotta font-bold uppercase tracking-wider">{chapter.year}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-es-text mb-4">{chapter.title}</h3>
                    <div className="space-y-3 text-es-text-muted leading-relaxed">
                      {chapter.content.map((para, j) => (
                        <p key={j}>{para}</p>
                      ))}
                    </div>
                    {chapter.media && (
                      <div className="mt-6">
                        {chapter.media.type === "full" && (
                          <div className="rounded-2xl overflow-hidden shadow-md max-w-sm mx-auto">
                            <Image
                              src={chapter.media.src}
                              alt={chapter.media.alt}
                              quality={85}
                              className="w-full h-auto object-contain"
                              placeholder="blur"
                            />
                          </div>
                        )}
                        {chapter.media.type === "single-portrait" && (
                          <div className="rounded-2xl overflow-hidden shadow-md max-w-xs mx-auto bg-gray-100">
                            <Image
                              src={chapter.media.src}
                              alt={chapter.media.alt}
                              quality={90}
                              className="w-full h-auto object-contain"
                              placeholder="blur"
                            />
                          </div>
                        )}
                        {chapter.media.type === "mosaic" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {chapter.media.items.map((img, k) => (
                              <div key={k} className="rounded-xl overflow-hidden shadow-sm">
                                <Image
                                  src={img.src}
                                  alt={img.alt}
                                  quality={85}
                                  className="w-full h-full object-cover aspect-square"
                                  placeholder="blur"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {chapter.media.type === "mosaic-plus-feature" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {chapter.media.items.map((img, k) => (
                                <div key={k} className="rounded-xl overflow-hidden shadow-sm">
                                  <Image
                                    src={img.src}
                                    alt={img.alt}
                                    quality={85}
                                    className="w-full h-full object-cover aspect-square"
                                    placeholder="blur"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-md max-w-sm mx-auto">
                              <Image
                                src={chapter.media.feature.src}
                                alt={chapter.media.feature.alt}
                                quality={85}
                                className="w-full h-auto object-contain"
                                placeholder="blur"
                              />
                            </div>
                          </div>
                        )}
                        {chapter.media.type === "placeholder" && (
                          <div
                            className="rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center p-6 text-center"
                            style={{ height: 300 }}
                          >
                            <p className="text-sm italic text-gray-500 max-w-md">{chapter.media.label}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2026 — L'écosystème */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">2026</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mt-3 mb-4">L&apos;écosystème</h2>
            <p className="text-es-text-muted max-w-2xl mx-auto leading-relaxed">
              Trois entités, un écosystème. Trois portes d&apos;entrée. Une vision : te donner les outils que j&apos;aurais voulu avoir au début.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* ES Academy */}
            <Link
              href="/academy"
              className="group rounded-2xl p-8 text-white hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium relative">Formation</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-3 relative">ES Academy</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative">
                Pour ceux qui veulent apprendre à investir en immobilier, de zéro ou en progression.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-es-gold group-hover:gap-2 transition-all relative">
                Découvrir →
              </span>
            </Link>

            {/* ES Family */}
            <Link
              href="/family"
              className="group rounded-2xl p-8 text-white hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
              style={{ backgroundColor: "#006B58" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium relative">Communauté</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-3 relative">ES Family</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative">
                Pour ceux qui veulent progresser dans une communauté active : immobilier, fiscalité, bourse, actifs alternatifs.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-white group-hover:gap-2 transition-all relative">
                Rejoindre →
              </span>
            </Link>

            {/* Solstice Patrimoine */}
            <a
              href={SOLSTICE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl p-8 text-white hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
              style={{ backgroundColor: "#1B4332" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-xs uppercase tracking-widest text-white/50 font-medium relative">Conseil patrimonial</span>
              <h3 className="font-serif text-2xl font-bold mt-2 mb-3 relative">Solstice Patrimoine</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative">
                Pour ceux qui veulent structurer un patrimoine existant. Accompagnement régulé : certifications CIF, IAS, IOBSP.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-es-gold group-hover:gap-2 transition-all relative">
                Découvrir →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Pourquoi je fais tout ça aujourd'hui */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={bebeMicroPodcast}
                  alt="Emeline aujourd'hui, maternité et entrepreneuriat qui avancent ensemble"
                  quality={85}
                  className="w-full h-auto object-cover"
                  placeholder="blur"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div>
                <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Ma mission</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mt-3 mb-6">
                  Pourquoi je fais tout ça aujourd&apos;hui
                </h2>
                <div className="space-y-4 text-es-text-muted leading-relaxed">
                  <p>
                    J&apos;ai grandi en regardant mes parents travailler jour et nuit. Je les ai vus construire leur vie avec leurs mains, sans bénéficier des mêmes outils que ceux qui héritent.
                  </p>
                  <p>
                    Quand j&apos;ai travaillé dans un fonds à 250 millions d&apos;euros, j&apos;ai compris une chose : le fossé entre ceux qui construisent un patrimoine et ceux qui n&apos;y arrivent pas, ce n&apos;est pas l&apos;argent. C&apos;est la méthode. C&apos;est la connaissance. C&apos;est le réseau.
                  </p>
                  <p>
                    Ma mission aujourd&apos;hui, c&apos;est de rendre cette connaissance accessible. Pas sous forme de promesses magiques « rentier en 3 ans ». Sous forme d&apos;outils concrets, de communauté active, et de méthodes testées sur mes propres biens.
                  </p>
                  <p className="font-medium text-es-text">
                    Trois entités, une vision : que tu n&apos;aies pas à attendre 24 ans pour comprendre comment l&apos;argent fonctionne vraiment.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Citation finale */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full overflow-hidden shadow-sm" style={{ width: 96, height: 96 }}>
              <Image
                src={deuxTrousseauxCles}
                alt="Emeline souriante tenant les clés de ses biens"
                width={192}
                height={192}
                quality={85}
                className="w-full h-full object-cover"
                placeholder="blur"
              />
            </div>
          </div>
          <p className="font-serif italic text-es-text text-2xl leading-relaxed">
            &ldquo; Si j&apos;ai pu le faire, tu peux le faire aussi. &rdquo;
          </p>
          <p className="text-sm text-es-text-muted mt-4 font-medium">— Emeline</p>
        </div>
      </section>

      {/* CTA final — appel découverte */}
      <section className="relative py-20 overflow-hidden" style={{ backgroundColor: "#006B58" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-es-terracotta-dark/20 via-transparent to-black/10" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl shrink-0 mx-auto md:mx-0">
              <Image
                src={bebeMicroPodcast}
                alt="Emeline prête pour un appel découverte"
                quality={85}
                className="w-full h-full object-cover"
                placeholder="blur"
              />
            </div>
            <div className="text-center md:text-left text-white">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                On en parle de vive voix ?
              </h2>
              <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-xl">
                Si mon histoire résonne avec la tienne, parlons-en. 30 minutes, gratuit, sans engagement.
                Je veux comprendre où tu en es avant de te dire quoi faire.
              </p>
              <Link
                href="/simulateurs/appel-decouverte?source=a-propos"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-8 py-4 text-base bg-white text-es-terracotta hover:bg-es-cream transition-all shadow-lg"
              >
                Réserver mon appel découverte
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BottomBanner />
      <Footer />
    </div>
  );
}
