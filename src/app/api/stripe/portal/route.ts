import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/stripe/portal
 *
 * Génère une session Stripe Customer Portal pour l'utilisateur authentifié.
 * Le portail couvre : factures Academy + Family, mise à jour carte, résiliation
 * Family (obligation loi Chatel), changement de plan, historique paiements.
 *
 * Configuration côté Stripe Dashboard requise :
 *  Settings > Billing > Customer portal > Activer + cocher les fonctionnalités.
 *
 * Auth : cookie session Supabase (SSR). Renvoie 401 si non connecté.
 *
 * Stratégie stripe_customer_id :
 *  Un user peut avoir Academy (enrollments.stripe_customer_id) ET/OU Family
 *  (family_subscriptions.stripe_customer_id). Dans 99% des cas c'est le même
 *  customer Stripe (un seul compte ES Academy), donc on prend celui qui existe.
 *  Priorité enrollments si présent (Academy = produit principal), sinon Family.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Lecture via service role pour bypass RLS sur enrollments + family_subscriptions
  // (les pages client ne lisent jamais ces tables directement, on est en route
  // serveur protégée par auth.getUser au-dessus).
  const supabaseAdmin = await createServiceClient();

  let stripeCustomerId: string | null = null;

  const { data: enroll } = await supabaseAdmin
    .from("enrollments")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  stripeCustomerId = (enroll?.stripe_customer_id as string | null) || null;

  if (!stripeCustomerId) {
    const { data: famSub } = await supabaseAdmin
      .from("family_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();
    stripeCustomerId = (famSub?.stripe_customer_id as string | null) || null;
  }

  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          "Aucun achat ou abonnement trouvé pour ton compte. Si tu viens de payer, attends 1 minute et réessaie.",
      },
      { status: 404 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${SITE_URL}/profil`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Le message de l'erreur Stripe peut contenir des détails techniques utiles
    // pour debug, mais on ne les expose pas au client (renvoie un message générique).
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[stripe/portal] session create failed:", message);
    return NextResponse.json(
      {
        error:
          "Le portail de gestion n'est pas encore configuré côté Stripe. Réessaie dans quelques minutes ou contacte-nous.",
      },
      { status: 500 }
    );
  }
}
