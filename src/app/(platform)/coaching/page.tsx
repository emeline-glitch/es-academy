import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";

// TODO: remplacer par les vrais liens Calendly quand ils seront créés
const CALENDLY_INCLUDED_URL = ""; // Coaching inclus (pas de paiement)
const CALENDLY_PAID_URL = ""; // Coaching 150€ avec paiement Stripe intégré

export default async function CoachingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Coaching</h1>
        <p className="text-gray-500 mt-1">Réserve une session en visio avec Emeline.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 1. Coaching inclus dans l'offre */}
        <Card className="flex flex-col h-full border-2 border-es-green/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-es-green/10 flex items-center justify-center">
              <span className="text-2xl">🎟</span>
            </div>
            <div>
              <p className="text-xs text-es-green font-semibold uppercase tracking-widest">Inclus</p>
              <h2 className="font-serif text-lg font-bold text-gray-900">Coaching dans ton offre</h2>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Tu as souscrit à un pack avec coaching inclus. Réserve directement tes sessions ci-dessous,
            sans paiement supplémentaire.
          </p>

          <div className="mt-auto">
            {CALENDLY_INCLUDED_URL ? (
              <a
                href={CALENDLY_INCLUDED_URL}
                target="_blank"
                rel="noopener noreferrer"
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
              Pas de paiement · Créneau confirmé par email
            </p>
          </div>
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
            Tu n&apos;as pas de coaching inclus dans ton offre ou tu veux une session en plus ?
            Une visio 1h avec Emeline, sur ton projet.
          </p>

          <div className="bg-es-cream rounded-xl p-4 mb-5 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-es-text">150€</span>
            <span className="text-xs text-es-text-muted">TTC · 1h visio</span>
          </div>

          <div className="mt-auto">
            {CALENDLY_PAID_URL ? (
              <a
                href={CALENDLY_PAID_URL}
                target="_blank"
                rel="noopener noreferrer"
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
        <a href="mailto:contact@emelinesiron.com" className="text-es-green hover:underline">contact@emelinesiron.com</a>
      </p>
    </div>
  );
}
