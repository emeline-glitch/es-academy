import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function Merci() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-es-green/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-es-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mb-4">
            Bienvenue dans ES Academy !
          </h1>
          <p className="text-lg text-es-text-muted mb-8 leading-relaxed">
            Ton paiement a été confirmé. Tu vas recevoir tes identifiants de connexion par email dans les prochaines minutes.
          </p>

          <div className="bg-white rounded-2xl p-8 border border-es-cream-dark text-left mb-8">
            <h2 className="font-serif text-lg font-bold text-es-text mb-4">Tes prochaines étapes :</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Vérifie ton email", desc: "Tes identifiants de connexion arrivent dans quelques minutes." },
                { step: "2", title: "Connecte-toi", desc: "Accède à ton espace de formation avec tes identifiants." },
                { step: "3", title: "Commence le Module 1", desc: "Démarre avec \"Être un investisseur intelligent et rentable\"." },
                { step: "4", title: "Rejoins ES Family", desc: "Ton accès 3 mois gratuit à la communauté est activé." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-es-green flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-es-text text-sm">{item.title}</h3>
                    <p className="text-xs text-es-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="primary" size="lg" href="/connexion">
            Accéder à ma formation →
          </Button>

          <p className="text-xs text-es-text-muted mt-4">
            Un problème ? Contacte-nous à contact@emelinesiron.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
