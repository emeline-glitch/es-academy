import { NextResponse } from "next/server";
import { createAcademyCheckoutSession } from "@/lib/stripe/checkout";
import { validateBody } from "@/lib/validators/validate";
import { AcademyCheckoutSchema } from "@/lib/validators/stripe-checkout";
import { createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

// Plan -> montant TTC attendu (pour stats abandon de panier)
const ACADEMY_AMOUNT_CENTS: Record<string, number> = {
  "1x": 99800,
  "3x": 99800,
  "4x": 99800,
};

export async function POST(request: Request) {
  try {
    const v = await validateBody(request, AcademyCheckoutSchema);
    if (!v.ok) return v.response;
    const { plan } = v.data;

    const session = await createAcademyCheckoutSession({
      plan,
      successUrl: `${SITE_URL}/connexion?checkout=success&plan=${plan}`,
      cancelUrl: `${SITE_URL}/academy?checkout=cancelled`,
    });

    // Track l'attempt pour mesurer l'abandon de panier. Best-effort :
    // si la DB est lente ou indisponible, on ne bloque pas le checkout.
    try {
      const supabase = await createServiceClient();
      await supabase.from("checkout_attempts").insert({
        stripe_session_id: session.id,
        product: "academy",
        plan,
        amount_cents: ACADEMY_AMOUNT_CENTS[plan] || null,
        status: "pending",
      });
    } catch (trackErr) {
      console.error("[stripe/checkout] track attempt error:", trackErr);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // On ne log que le message (pas l'objet complet Stripe qui contient
    // requestId + détails de payload qui peuvent matérialiser des données
    // clients en clair dans les logs Vercel).
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[stripe/checkout]", message);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
