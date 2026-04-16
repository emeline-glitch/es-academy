import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Eleve";

  // TODO: Fetch enrollments and progress from Supabase
  // For now, show a placeholder dashboard

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">
          Bonjour, {displayName} !
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
            La Methode Emeline SIRON
          </h3>
          <p className="text-sm text-gray-500 mb-4 flex-1">
            15 modules — 64 lecons
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
          <p className="text-sm text-gray-400">D&apos;autres formations bientot</p>
        </Card>
      </div>

      {/* ES Family CTA */}
      <div className="mt-12">
        <div className="relative overflow-hidden rounded-2xl p-8" style={{ backgroundColor: "#2c6e55" }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <h2 className="font-serif text-xl font-bold text-white">Rejoins ES Family</h2>
              </div>
              <p className="text-white/70 text-sm mb-4 max-w-lg">
                La communaute patrimoniale d'Emeline Siron. Echanges entre investisseurs,
                lives mensuels, outils exclusifs, simulateurs avances et accompagnement continu.
              </p>
              <div className="flex gap-3">
                <Button href="/family" variant="cta" size="sm">
                  Decouvrir ES Family
                </Button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-white/40">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-xs">Membres</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">2x</p>
                <p className="text-xs">Lives/mois</p>
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
                Ton avis aide d'autres investisseurs a nous decouvrir. 2 minutes suffisent et ca compte enormement.
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

      {/* Coaching notes section */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
          Notes de coaching
        </h2>
        <Card>
          <p className="text-gray-500 text-sm">
            Tes notes de coaching apparaitront ici une fois que ta formatrice aura laisse un retour.
          </p>
        </Card>
      </div>
    </div>
  );
}
