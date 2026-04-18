import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { PRICING } from "@/lib/utils/constants";

export default function MerciOutils() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Confirmation */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-es-green/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-es-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mb-3">
            Tes outils sont en route !
          </h1>
          <p className="text-es-text-muted mb-8">
            Vérifie ta boîte mail (et les spams). Tu recevras tout dans les prochaines minutes.
          </p>

          {/* Upsell Academy */}
          <div className="bg-es-green rounded-2xl p-8 lg:p-10 text-white text-left relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Offre spéciale</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-3 mb-4">
                Tu veux aller plus loin ?
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Les outils gratuits te donnent un aperçu. La Méthode Emeline Siron te donne
                <strong className="text-white"> tout</strong> : 14 modules, 30h de vidéo, 60 outils, coaching et communauté.
              </p>

              <div className="bg-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-es-gold">{PRICING.academy.priceDisplay}€</span>
                  <span className="text-white/50 text-sm">TTC · Paiement unique</span>
                </div>
                <ul className="space-y-2">
                  {PRICING.academy.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="text-es-gold">✓</span>
                      {f}
                    </li>
                  ))}
                  <li className="text-sm text-white/50">+ {PRICING.academy.features.length - 4} autres avantages...</li>
                </ul>
              </div>

              <Button variant="cta" size="lg" className="w-full btn-gold-shimmer font-semibold" href="/academy">
                Découvrir la méthode complète →
              </Button>
              <p className="text-xs text-white/30 mt-3 text-center">Garantie 14 jours satisfait ou remboursé</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
