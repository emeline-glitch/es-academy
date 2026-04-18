import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface FamilyLockedProps {
  title: string;
  description: string;
  teaserBullets?: string[];
}

export function FamilyLocked({ title, description, teaserBullets }: FamilyLockedProps) {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mb-2">{title}</h1>
          <p className="text-es-text-muted mb-10 text-lg leading-relaxed">{description}</p>

          <div className="relative bg-gradient-to-br from-es-terracotta/10 via-white to-es-green/5 border-2 border-es-terracotta/30 rounded-3xl p-8 sm:p-12 text-center shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-es-terracotta/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-es-green/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-es-terracotta/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-es-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v.01M12 12a3 3 0 100-6 3 3 0 000 6zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                </svg>
              </div>

              <span className="text-xs uppercase tracking-[0.25em] text-es-terracotta font-semibold">ES Family</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-es-text mt-3 mb-4">
                Disponible dans l&apos;application ES Family
              </h2>

              <div className="flex items-baseline justify-center gap-2 mb-5">
                <span className="text-5xl sm:text-6xl font-bold text-es-green">19€</span>
                <span className="text-base text-es-text-muted">/ mois</span>
              </div>

              <p className="text-sm sm:text-base text-es-text-muted max-w-md mx-auto mb-8 leading-relaxed">
                Rejoins la communauté privée pour accéder à tous les simulateurs avancés, aux lives mensuels, à l&apos;annuaire des membres et aux bons plans exclusifs.
              </p>

              {teaserBullets && teaserBullets.length > 0 && (
                <ul className="text-left max-w-md mx-auto mb-8 space-y-2.5">
                  {teaserBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-es-text">
                      <svg className="w-5 h-5 text-es-terracotta mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button variant="primary" href="/family" size="lg" className="w-full sm:w-auto sm:px-10">
                Rejoindre ES Family →
              </Button>
              <p className="text-xs text-es-text-muted/60 mt-4">Sans engagement · Annulable en 1 clic</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
