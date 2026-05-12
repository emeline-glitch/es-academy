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

      {/* ES Family CTA : carte compacte, charte mint */}
      <div className="mt-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-es-mint-dark to-es-mint-deep">
          <div className="absolute top-0 right-0 w-64 h-64 bg-es-mint/15 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
          <div className="relative grid lg:grid-cols-5 gap-8 p-6 md:p-8">
            {/* Pitch + CTA */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-es-mint" />
                <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.15em]">ES Family</span>
              </div>
              <h2 className="text-2xl md:text-[28px] font-bold text-white leading-tight mb-3">
                Ta communauté patrimoniale, dans ta poche.
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-5">
                Lives, simulateurs, partenaires et 1 800 membres actifs.
                <span className="block mt-1 text-white/95 font-medium">Pour le prix d&apos;un forfait téléphonique.</span>
              </p>
              <a
                href="/family"
                className="inline-flex items-center justify-center font-medium rounded-full px-5 py-2.5 bg-white text-es-mint-dark hover:bg-es-mint-light transition-all text-sm shadow-sm w-fit"
              >
                Rejoindre ES Family : 19€/mois
                <svg className="w-3.5 h-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-white/55 text-xs mt-2">Tarif fondateur à vie · Sans engagement</p>
            </div>

            {/* Features condensées */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-2.5">
              {[
                { icon: "📱", label: "App mobile 7j/7" },
                { icon: "🎙", label: "Lives + replays" },
                { icon: "📊", label: "5 simulateurs" },
                { icon: "🤝", label: "Partenaires + codes promo" },
                { icon: "💬", label: "Groupes thématiques" },
                { icon: "👥", label: "Annuaire + networking" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-white/5">
                  <span className="text-base leading-none">{f.icon}</span>
                  <span className="text-xs font-medium text-white leading-snug">{f.label}</span>
                </div>
              ))}
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
