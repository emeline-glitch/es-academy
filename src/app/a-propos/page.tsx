import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { LazyIframe } from "@/components/ui/LazyIframe";
import { JsonLd } from "@/components/seo/JsonLd";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "Qui est Emeline ?",
  description: "L'histoire d'Emeline Siron : de fille de garagiste à investisseuse avec 55 locataires. Son parcours, ses échecs, ses victoires.",
  path: "/a-propos",
});

const chapters = [
  {
    id: "debut",
    year: "Avant tout",
    title: "Fille de garagiste, Val-d'Oise",
    content: [
      "Parents commerçants, enfance sans bowling ni sorties au parc. J'ai grandi dans un garage auto, à bricoler avec mon père. J'ai toujours aimé les activités manuelles.",
      "Au lycée, j'ai loupé mon bac malgré 27 points d'avance — j'étais en conflit avec l'école et ils m'ont fait passer pour l'exemple. Premier vrai échec de ma vie.",
    ],
  },
  {
    id: "parcours-pro",
    year: "2008–2019",
    title: "Le parcours classique — et les burnouts",
    content: [
      "BTS, licence, master en gestion de patrimoine immobilier. Puis 2 ans en alternance dans une boîte de centres commerciaux : deux burnouts avant 25 ans. L'ambiance était pourrie, 19 personnes sont parties en 6 mois.",
      "Intérim, Swiss Life, Lifento — 3 ans à gérer 250 millions d'euros d'immobilier de santé en Europe (EHPAD, dialyse, psychiatrie). Je passais ma vie sur les chantiers. J'adorais ça.",
    ],
  },
  {
    id: "declic",
    year: "2020",
    title: "Le déclic",
    content: [
      "Deux relations toxiques avant de comprendre ma valeur. La boxe comme défouloir (5 ans). Puis un jour, une amie me propose de visiter un bien avec elle. Déclic total.",
      "En 2 semaines j'ai signé 2 compromis pour 15 appartements. J'ai appliqué ce que je savais faire pour les fonds : business plans, tableaux, négociation. Mon premier immeuble de 8 appartements a généré +1 300€ de cash-flow mensuel dès le premier mois.",
    ],
  },
  {
    id: "enchainement",
    year: "2020–2022",
    title: "L'enchaînement",
    content: [
      "En 18 mois : 2 colocations, une maison divisée en 4 studios, un coliving de 8 chambres. J'ai même aidé mon artisan à monter sa boîte avec une équipe de 8 personnes.",
      "Parallèlement, mon Instagram explose. Clause d'exclusivité dans mon contrat — je dois choisir. Septembre 2021, je démissionne : j'étais à 15 000€ de loyer facturé par mois.",
    ],
  },
  {
    id: "formation",
    year: "2022–aujourd'hui",
    title: "De la formation à la communauté",
    content: [
      "Je m'associe avec Thomas (meilleure décision de ma vie). La formation sort le 8 mai 2022 : 80 ventes en 3 jours. En septembre, on passe de 2 à 8 personnes dans l'équipe.",
      "Aujourd'hui : 55 locataires, +1 900 élèves formés, une communauté de 500+ investisseurs dans ES Family, un podcast hebdo. Et la conviction profonde que tout le monde peut y arriver.",
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
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Mon histoire</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
            Qui est Emeline ?
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            De fille de garagiste à investisseuse avec 55 locataires.
            Parcours, échecs, victoires.
          </p>
        </div>
      </section>

      {/* Photo + intro */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl relative">
                <Image
                  src="/images/emeline-siron.png"
                  alt="Emeline Siron — Formatrice en investissement immobilier"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover object-top"
                  quality={85}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div>
                <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Un roman vrai</span>
                <h2 className="font-serif text-3xl font-bold text-es-text mt-3 mb-6">
                  Mon parcours, sans filtre.
                </h2>
                <div className="space-y-4 text-es-text-muted leading-relaxed">
                  <p>
                    Fille de garagiste, enfance en Val-d&apos;Oise, loupage du bac, deux burnouts avant 25 ans,
                    deux relations toxiques, puis un déclic qui a tout changé.
                  </p>
                  <p>
                    En 5 ans : 55 locataires, une formation qui a touché +1 900 élèves, une communauté de
                    500+ investisseurs, un podcast hebdo, une équipe de 8 personnes.
                  </p>
                  <p className="font-medium text-es-text">
                    Voici comment j&apos;y suis arrivée. Et pourquoi je suis persuadée que tu peux le faire aussi.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="py-16 bg-es-green">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-white">
          {[
            { value: "35", label: "chambres de colocation" },
            { value: "15", label: "appartements" },
            { value: "1", label: "garage" },
            { value: "1", label: "local commercial" },
            { value: "+1 900", label: "élèves formés" },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-es-gold">{stat.value}</div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* L'histoire en chapitres */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">L&apos;histoire complète</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tout a commencé dans un garage</h2>
          </div>

          <div className="space-y-12">
            {chapters.map((chapter, i) => (
              <ScrollReveal key={chapter.id} delay={i * 50}>
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
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* Signature */}
          <div className="mt-16 pt-8 border-t border-es-cream-dark text-center">
            <p className="font-serif italic text-es-text-muted text-lg">
              &ldquo; Si j&apos;ai pu le faire, tu peux le faire aussi. &rdquo;
            </p>
            <p className="text-sm text-es-text mt-3 font-medium">— Emeline</p>
          </div>
        </div>
      </section>

      {/* Podcast */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <img
              src="/images/logo-otb.png"
              alt="Out of the Box — Podcast Emeline Siron"
              className="h-16 sm:h-20 mx-auto mb-4"
            />
            <p className="text-es-text-muted max-w-xl mx-auto">
              Chaque mardi, un épisode de 30 minutes pour repenser ton rapport
              à l&apos;argent, l&apos;investissement et l&apos;entrepreneuriat.
              Interviews, analyses, retours d&apos;expérience.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-es-cream-dark bg-white">
            <LazyIframe
              src="https://player.ausha.co/?showId=k5xV9FYeMPDx&color=%23000000&display=horizontal&multishow=false&playlist=true&dark=false&v=3&playerId=ausha-apropos"
              height={420}
              title="Podcast Out of the Box"
              placeholder="Charger les épisodes du podcast"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-es-cream text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-4">
            Prêt(e) à passer à l&apos;action ?
          </h2>
          <p className="text-es-text-muted mb-8">
            Découvre la méthode complète ou rejoins la communauté.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" href="/academy">
              ES Academy →
            </Button>
            <Button variant="secondary" size="lg" href="/family">
              ES Family →
            </Button>
          </div>
        </div>
      </section>

      <BottomBanner />
      <Footer />
    </div>
  );
}
