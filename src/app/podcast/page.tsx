import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Podcast Out of the Box : par Emeline Siron",
  description: "Chaque mardi, un épisode de 30 minutes pour repenser ton rapport à l'argent, l'investissement et l'entrepreneuriat.",
  path: "/podcast",
});

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      {/* Hero */}
      <section className="py-16 lg:py-24 bg-es-green-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <img
            src="/images/logo-otb.png"
            alt="Out of the Box"
            className="h-20 sm:h-28 mx-auto mb-6"
          />
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            Chaque mardi, un épisode de 30 minutes pour repenser ton rapport à l&apos;argent,
            l&apos;investissement et l&apos;entrepreneuriat. Interviews, analyses, retours d&apos;expérience.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://podcast.emelinesiron.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-es-gold text-white px-6 py-3 rounded-xl font-medium hover:bg-es-gold-dark transition-colors">
              🎧 Apple Podcasts
            </a>
            <a href="https://podcast.emelinesiron.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20">
              🎵 Spotify
            </a>
            <a href="https://podcast.emelinesiron.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20">
              📱 Toutes les plateformes
            </a>
          </div>
        </div>
      </section>

      {/* Player Ausha */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-6 text-center">Derniers épisodes</h2>
          <div className="rounded-2xl overflow-hidden border border-es-cream-dark">
            <iframe
              name="Ausha Podcast Player"
              frameBorder="0"
              loading="lazy"
              height="420"
              style={{ border: "none", width: "100%", height: "420px" }}
              src="https://player.ausha.co/?showId=k5xV9FYeMPDx&color=%23000000&display=horizontal&multishow=false&playlist=true&dark=false&v=3&playerId=ausha-podcast-page"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-es-cream text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-4">
            Envie d&apos;aller plus loin que le podcast ?
          </h2>
          <p className="text-es-text-muted mb-8">
            La Méthode Emeline Siron te donne tout : 14 modules, 30h de vidéo, 60 outils.
          </p>
          <Button variant="primary" size="lg" href="/academy">
            Découvrir ES Academy →
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
