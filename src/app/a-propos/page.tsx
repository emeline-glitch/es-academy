import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { LazyIframe } from "@/components/ui/LazyIframe";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "À propos — Emeline Siron",
  description: "De l'atelier de mécanique familial à 55 locataires. Découvrez le parcours d'Emeline Siron, formatrice en investissement immobilier.",
  path: "/a-propos",
});

const timeline = [
  { year: "2015", title: "Premier investissement", desc: "À 25 ans, achat du premier appartement. Pas d'héritage, pas de réseau. Juste la bonne méthode." },
  { year: "2017", title: "10 lots gérés", desc: "Enchaînement des opérations : colocation, immeuble de rapport, LMNP. Le patrimoine se construit." },
  { year: "2019", title: "Lancement des formations", desc: "Partage de la méthode avec les premiers élèves. 98% de satisfaction dès le début." },
  { year: "2021", title: "1 000 élèves formés", desc: "La communauté grandit. Création d'ES Family pour accompagner les investisseurs au quotidien." },
  { year: "2023", title: "55 locataires", desc: "Le patrimoine continue de croître. Lancement du podcast Out of the Box." },
  { year: "2025", title: "ES Academy v2", desc: "Refonte complète de la plateforme. 14 modules, 60 outils, coaching personnalisé." },
];

export default function APropos() {
  return (
    <div className="min-h-screen">
      <Header />
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "À propos", url: `${SITE_URL}/a-propos` },
      ])} />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">À propos</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
            De l&apos;atelier de mécanique à 55 locataires
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Pas d&apos;héritage. Pas de réseau. Pas d&apos;excuse.
            Juste une méthode qui fonctionne.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl relative">
                <Image
                  src="/images/emeline-siron-800.png"
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
                <h2 className="font-serif text-3xl font-bold text-es-text mb-6">
                  J&apos;ai grandi dans un garage automobile.
                </h2>
                <div className="space-y-4 text-es-text-muted leading-relaxed">
                  <p>
                    Mon père était mécanicien. Ma mère, secrétaire comptable. Je n&apos;ai jamais eu de modèle
                    dans l&apos;investissement immobilier. Personne dans mon entourage n&apos;avait de patrimoine.
                  </p>
                  <p>
                    À 25 ans, j&apos;ai décidé que ma vie ne se résumerait pas à attendre la retraite en espérant
                    que tout aille bien. J&apos;ai acheté mon premier bien. Avec zéro euro d&apos;apport.
                  </p>
                  <p>
                    Aujourd&apos;hui, après 9 ans d&apos;investissement, je gère 55 locataires.
                    J&apos;ai structuré tout ce que j&apos;ai appris dans une méthode que je transmets
                    à des centaines d&apos;élèves chaque année.
                  </p>
                  <p className="font-medium text-es-text">
                    Mon objectif : vous prouver que c&apos;est accessible à tout le monde.
                    Pas besoin d&apos;être riche pour commencer. Pas besoin de connaître quelqu&apos;un.
                    Il vous faut juste la bonne méthode et l&apos;envie d&apos;agir.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="py-16 bg-es-green">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: "55", label: "locataires gérés" },
            { value: "9", label: "ans d'expérience" },
            { value: "1 900+", label: "élèves formés" },
            { value: "4.9/5", label: "sur Trustpilot" },
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

      {/* Timeline */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Parcours</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Le chemin parcouru</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-es-cream-dark" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="relative flex gap-6 pl-2">
                    <div className="w-10 h-10 rounded-full bg-es-green flex items-center justify-center shrink-0 z-10 border-4 border-es-cream">
                      <span className="text-[10px] font-bold text-white">{item.year}</span>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-es-cream-dark flex-1">
                      <h3 className="font-medium text-es-text mb-1">{item.title}</h3>
                      <p className="text-sm text-es-text-muted">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
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
              Chaque mardi, un épisode de 30 minutes pour repenser votre rapport
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
            Prête à passer à l&apos;action ?
          </h2>
          <p className="text-es-text-muted mb-8">
            Découvrez la méthode complète ou rejoignez la communauté.
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

      <Footer />
    </div>
  );
}
