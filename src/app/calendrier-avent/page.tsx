import { createClient } from "@/lib/supabase/server";
import SeasonalOptInForm from "@/components/landings/SeasonalOptInForm";

export const metadata = {
  title: "Calendrier de l'Avent investisseur | Emeline Siron",
  description:
    "24 jours, 24 conseils Emeline pour booster ton portefeuille immo. Du 1er au 24 decembre, un email par jour.",
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

export default async function CalendrierAventPage() {
  const supabase = await createClient();
  const { data: lm } = await supabase
    .from("lead_magnets")
    .select("is_active, available_from")
    .eq("slug", "calendrier-avent")
    .maybeSingle();

  const isOpen = lm?.is_active === true;
  const availableFromLabel = formatFrenchDate(lm?.available_from);

  return (
    <div className="min-h-screen bg-es-cream">
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-es-terracotta mb-4">
            Edition 2026 · Du 1er au 24 decembre
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-es-text leading-tight mb-6">
            Le calendrier de l&apos;Avent de l&apos;investisseur
          </h1>
          <p className="text-lg text-es-text-muted max-w-2xl mx-auto leading-relaxed">
            24 jours, 24 conseils, 24 outils pour booster ton portefeuille immo. Un email court chaque matin pendant les fetes, parce que les meilleures decisions se prennent en regardant l&apos;annee qui finit.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-5 text-es-text">
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🎁</span>
              <div>
                <h3 className="font-bold text-base mb-1">Du concret, pas du blabla</h3>
                <p className="text-sm text-es-text-muted">Chaque mail tient en 3 minutes de lecture, avec une action a faire le jour meme.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">📊</span>
              <div>
                <h3 className="font-bold text-base mb-1">Bilans + projection 2027</h3>
                <p className="text-sm text-es-text-muted">Le bon moment pour faire le point sur ton patrimoine et ajuster ta strategie.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🎄</span>
              <div>
                <h3 className="font-bold text-base mb-1">Bonus surprise le 24</h3>
                <p className="text-sm text-es-text-muted">Le dernier mail contient un cadeau premium reserve aux abonnes du calendrier.</p>
              </div>
            </div>
          </div>

          <SeasonalOptInForm
            formSlug="calendrier-avent"
            isOpen={isOpen}
            availableFromLabel={availableFromLabel}
            ctaOpen="Recevoir le calendrier"
            ctaWaitlist="M'inscrire a la liste d'ouverture"
            reassurance="1 email par jour du 1er au 24 decembre. Desinscription en 1 clic."
          />
        </div>
      </section>
    </div>
  );
}
