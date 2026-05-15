import { createClient, getCachedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Breadcrumb } from "@/components/platform/Breadcrumb";

const CALENDLY_INCLUDED_URL = "https://calendly.com/emeline-emeline-siron/coaching-es-academy-package"; // Coaching inclus dans un package
const CALENDLY_PAID_URL = "https://calendly.com/emeline-emeline-siron/coaching-1to1-emeline"; // 300€ session unitaire avec Emeline
const CALENDLY_PACKAGE_SALES_URL = "https://calendly.com/antony-emeline-siron/coaching-acceleration"; // Antony : vente packages coaching

export default async function CoachingPage() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("coaching_credits_total, coaching_credits_used")
    .eq("id", user.id)
    .maybeSingle();

  const total = profile?.coaching_credits_total ?? 0;
  const used = profile?.coaching_credits_used ?? 0;
  const remaining = Math.max(total - used, 0);
  const hasIncluded = remaining > 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Coaching" }]} />

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Coaching</h1>
        <p className="text-gray-500 mt-1">Réserve une session en visio avec Emeline.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 1. Coaching :
             - Si l'élève a des sessions incluses : on lui propose de les réserver
             - Sinon : on transforme la card en CTA d'achat de package (RDV avec
               Antony pour qualifier + vendre le package adapté). C'est la vraie
               "porte d'entrée package" depuis l'app. */}
        <Card className={`flex flex-col h-full ${hasIncluded ? "border-2 border-es-green/30 bg-es-green/[0.02]" : "border-2 border-es-gold/30 bg-es-gold/[0.04]"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasIncluded ? "bg-es-green/10" : "bg-es-gold/15"}`}>
              <span className="text-2xl">{hasIncluded ? "🎟" : "🚀"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-widest ${hasIncluded ? "text-es-green" : "text-es-gold-dark"}`}>
                {hasIncluded ? "Inclus" : "Package"}
              </p>
              <h2 className="font-serif text-lg font-bold text-gray-900">
                {hasIncluded ? "Coaching dans ton offre" : "Prendre un package de coaching"}
              </h2>
            </div>
          </div>

          {hasIncluded ? (
            <>
              <div className="inline-flex items-center gap-2 bg-es-green/10 text-es-green font-semibold text-sm px-3 py-1.5 rounded-full mb-4 self-start">
                <span className="w-2 h-2 rounded-full bg-es-green animate-pulse" />
                {remaining} session{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                {total > 0 && <span className="text-es-green/60 font-normal">/ {total} au total</span>}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Tu as du coaching inclus dans ton offre. Réserve directement ta prochaine session ci-dessous, sans paiement.
              </p>

              <div className="mt-auto">
                {CALENDLY_INCLUDED_URL ? (
                  <a
                    href={CALENDLY_INCLUDED_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cta="coaching-included-book"
                    className="inline-flex items-center justify-center w-full bg-es-green text-white font-semibold py-3.5 rounded-xl hover:bg-es-green-light transition-colors"
                  >
                    Réserver ma session →
                  </a>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 font-medium py-3.5 rounded-xl text-center text-sm">
                    Bientôt disponible
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-3 text-center">
                  Pas de paiement · Créneau confirmé par email · Compteur mis à jour après la confirmation Calendly
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Tu veux un accompagnement plus régulier ? Le package de coaching te donne plusieurs sessions avec Emeline pour accélérer ton premier achat (chasse, négo, financement, signature).
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Antony, de mon équipe, t&apos;appelle 20 min pour qualifier ton projet et te proposer le package adapté.
              </p>

              <div className="mt-auto">
                <a
                  href={CALENDLY_PACKAGE_SALES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="coaching-packages-sales"
                  className="inline-flex items-center justify-center w-full bg-es-gold-dark text-white font-semibold py-3.5 rounded-xl hover:bg-es-gold transition-colors"
                >
                  Découvrir les packages →
                </a>
                <p className="text-[11px] text-gray-400 mt-3 text-center">
                  Appel de qualification gratuit · 20 min avec Antony
                </p>
              </div>
            </>
          )}
        </Card>

        {/* 2. Coaching payant à l'unité */}
        <Card className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-es-gold/15 flex items-center justify-center">
              <span className="text-2xl">💫</span>
            </div>
            <div>
              <p className="text-xs text-es-gold-dark font-semibold uppercase tracking-widest">À l&apos;unité</p>
              <h2 className="font-serif text-lg font-bold text-gray-900">Coaching supplémentaire</h2>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {hasIncluded
              ? "Tu veux une session en plus de ton pack ? Une visio 1h avec Emeline, sur ton projet."
              : "Tu n'as pas de coaching inclus dans ton offre ? Réserve une session à l'unité. Visio 1h avec Emeline, sur ton projet."}
          </p>

          <div className="bg-es-cream rounded-xl p-4 mb-5 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-es-text">300€</span>
            <span className="text-xs text-es-text-muted">TTC · 1h visio</span>
          </div>

          <div className="mt-auto">
            {CALENDLY_PAID_URL ? (
              <a
                href={CALENDLY_PAID_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="coaching-paid-book"
                className="inline-flex items-center justify-center w-full bg-es-gold-dark text-white font-semibold py-3.5 rounded-xl hover:bg-es-gold transition-colors"
              >
                Réserver et payer →
              </a>
            ) : (
              <div className="w-full bg-gray-100 text-gray-500 font-medium py-3.5 rounded-xl text-center text-sm">
                Bientôt disponible
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Paiement sécurisé · Créneau confirmé dans la foulée
            </p>
          </div>
        </Card>
      </div>

      <p className="text-xs text-gray-400 italic mt-8 text-center max-w-2xl mx-auto">
        Une question avant de réserver ? Écris-moi à{" "}
        <a href="mailto:contact@emeline-siron.fr" className="text-es-green hover:underline">contact@emeline-siron.fr</a>
      </p>
    </div>
  );
}
