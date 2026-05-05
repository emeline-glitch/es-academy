import { getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function Dashboard() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Élève";

  // TODO: Fetch enrollments and progress from Supabase
  // For now, show a placeholder dashboard

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">
          Bonjour {displayName} !
        </h1>
        <p className="text-gray-500 mt-1">Bienvenue dans ton espace de formation.</p>
      </div>

      {/* Enrolled courses */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder course card */}
        <Card hover className="flex flex-col">
          <div className="aspect-video bg-es-green/10 rounded-lg mb-4 flex items-center justify-center">
            <span className="font-serif text-2xl font-bold text-es-green">ES</span>
          </div>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">
            La Méthode Emeline SIRON
          </h3>
          <p className="text-sm text-gray-500 mb-4 flex-1">
            14 modules · 30h de vidéo · 60 outils
          </p>
          <ProgressBar value={0} label="Progression" className="mb-4" />
          <Button href="/cours/methode-emeline-siron" variant="primary" className="w-full">
            Commencer
          </Button>
        </Card>

        {/* Empty state for no more courses */}
        <Card className="flex flex-col items-center justify-center text-center border-dashed border-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">D&apos;autres formations bientôt</p>
        </Card>
      </div>

      {/* ES Family CTA : terracotta */}
      <div className="mt-12">
        <div className="relative overflow-hidden rounded-2xl" style={{ backgroundColor: "#c4663a" }}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative p-8 md:p-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👑</span>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Communauté patrimoniale</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">Rejoins ES Family</h2>
            <p className="text-white/85 text-sm md:text-base mb-5 max-w-2xl leading-relaxed">
              Pas juste un groupe immo. Un écosystème patrimoine complet : immo, bourse, fiscalité, entrepreneuriat, mindset : dans ta poche, 7j/7.
              <strong className="block mt-1 text-white">1 800 membres déjà actifs.</strong>
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: "📱",
                  title: "App mobile 7j/7",
                  desc: "Ta communauté dans ta poche, disponible partout et à tout moment.",
                },
                {
                  icon: "🎙",
                  title: "Lives mensuels + replays à vie",
                  desc: "Décryptage d'opportunités, Q&A et études de cas avec Emeline et ses partenaires experts.",
                },
                {
                  icon: "💬",
                  title: "Groupes thématiques actifs",
                  desc: "Immobilier, patrimoine, bricolage, gestion locative, bourse, entrepreneuriat, fiscalité…",
                },
                {
                  icon: "📊",
                  title: "5 simulateurs intégrés",
                  desc: "Capacité d'emprunt, cashflow mensuel, frais de notaire, prix au m² (France), rendement locatif.",
                },
                {
                  icon: "🛠",
                  title: "Bons plans Sorel",
                  desc: "Chaque semaine, les promos matériaux, mobilier et équipement sélectionnées pour les chantiers.",
                },
                {
                  icon: "🤝",
                  title: "Partenaires exclusifs",
                  desc: "Fiscaliste, expert-comptable, décoratrice, artisan travaux, chasseur immo : codes promo réservés aux membres.",
                },
                {
                  icon: "🏆",
                  title: "Gamification + parrainage",
                  desc: "Badges et classement pour progresser. Ton code parrain = mois offerts à chaque filleul.",
                },
                {
                  icon: "👥",
                  title: "Annuaire + networking",
                  desc: "Retrouve les membres par région ou par projet, ouvre une discussion directe, construis ton réseau.",
                },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                  <span className="text-xl shrink-0 leading-none mt-0.5">{f.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">{f.title}</p>
                    <p className="text-xs text-white/70 leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href="/family"
                className="inline-flex items-center justify-center font-semibold rounded-lg px-6 py-3 bg-white text-es-terracotta hover:bg-es-cream transition-all text-sm"
              >
                Découvrir ES Family : 19€/mois fondateurs →
              </a>
              <div className="flex items-center gap-4 text-white/60 text-xs">
                <span>Sans engagement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incitation avis Google/Trustpilot */}
      <div className="mt-8">
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Tu aimes la formation ? Dis-le ! 💬</h3>
              <p className="text-sm text-gray-500">
                Ton avis aide d&apos;autres investisseurs à nous découvrir. 2 minutes suffisent et ça compte énormément.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button href="https://www.google.com/search?q=emeline+siron+avis" variant="secondary" size="sm" target="_blank" rel="noopener">
                ⭐ Avis Google
              </Button>
              <Button href="https://fr.trustpilot.com/review/emelinesiron.com" variant="secondary" size="sm" target="_blank" rel="noopener">
                ⭐ Trustpilot
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
