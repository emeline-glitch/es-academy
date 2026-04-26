import { createClient } from "@/lib/supabase/server";
import SeasonalOptInForm from "@/components/landings/SeasonalOptInForm";

export const metadata = {
  title: "La chasse aux oeufs immo | Emeline Siron",
  description:
    "7 cachettes, 7 surprises pour ton portefeuille immo. Une semaine de jeu pendant Paques pour booster ta strategie.",
};

function formatFrenchDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ChasseOeufsPage() {
  const supabase = await createClient();
  const { data: lm } = await supabase
    .from("lead_magnets")
    .select("is_active, available_from")
    .eq("slug", "chasse-oeufs")
    .maybeSingle();

  const isOpen = lm?.is_active === true;
  const availableFromLabel = formatFrenchDate(lm?.available_from);

  return (
    <div className="min-h-screen bg-es-cream">
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-es-terracotta mb-4">
            Edition Paques · Une semaine de jeu
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-es-text leading-tight mb-6">
            La chasse aux oeufs immo
          </h1>
          <p className="text-lg text-es-text-muted max-w-2xl mx-auto leading-relaxed">
            7 cachettes, 7 surprises pour ton portefeuille. Un email par jour pendant la semaine de Paques avec un mini-defi, un outil ou un cadeau. A la fin, un bonus reserve a celles et ceux qui ont joue le jeu jusqu&apos;au bout.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-5 text-es-text">
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🥚</span>
              <div>
                <h3 className="font-bold text-base mb-1">7 jours, 7 surprises</h3>
                <p className="text-sm text-es-text-muted">Un mail court chaque matin avec un mini-defi a faire dans la journee. Effort : 5 minutes maxi.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🐣</span>
              <div>
                <h3 className="font-bold text-base mb-1">Format ludique</h3>
                <p className="text-sm text-es-text-muted">Pas un cours magistral. Des questions, des choix a faire, des outils a tester. Tu apprends en jouant.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🎁</span>
              <div>
                <h3 className="font-bold text-base mb-1">Cadeau final pour les finishers</h3>
                <p className="text-sm text-es-text-muted">Si tu vas au bout des 7 jours, tu debloques un bonus premium qui n&apos;est pas dispo en boutique.</p>
              </div>
            </div>
          </div>

          <SeasonalOptInForm
            formSlug="chasse-oeufs"
            isOpen={isOpen}
            availableFromLabel={availableFromLabel}
            ctaOpen="Rejoindre la chasse"
            ctaWaitlist="M'inscrire a la liste d'ouverture"
            reassurance="1 email par jour pendant 7 jours. Desinscription en 1 clic."
          />
        </div>
      </section>
    </div>
  );
}
