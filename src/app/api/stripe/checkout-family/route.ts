import { NextResponse } from "next/server";
import { createFamilyCheckoutSession } from "@/lib/stripe/checkout";
import { FAMILY_LAUNCH_PENDING } from "@/lib/utils/constants";
import { validateBody, validateQuery } from "@/lib/validators/validate";
import {
  FamilyCheckoutSchema,
  FamilyCheckoutQuerySchema,
} from "@/lib/validators/stripe-checkout";
import { createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

// Plan -> montant TTC mensuel (ce qui sera prelevee la 1ere fois)
const FAMILY_AMOUNT_CENTS: Record<string, number> = {
  fondateur: 1900,
  standard: 2900,
};

async function trackFamilyAttempt(sessionId: string, plan: string, email: string | null = null) {
  try {
    const supabase = await createServiceClient();
    await supabase.from("checkout_attempts").insert({
      stripe_session_id: sessionId,
      product: "family",
      plan,
      email: email?.toLowerCase() || null,
      amount_cents: FAMILY_AMOUNT_CENTS[plan] || null,
      status: "pending",
    });
  } catch (err) {
    console.error("[stripe/checkout-family] track attempt error:", err);
  }
}

/**
 * GET /api/stripe/checkout-family?plan=fondateur
 * Cree une session Stripe et redirige (303) vers la page Stripe Checkout.
 * Utilisable directement dans un <a href="..."> ou MobileCta.
 *
 * Guard : si FAMILY_LAUNCH_PENDING (App iOS en validation Apple),
 * on bloque le checkout et on redirige vers /family.
 */
export async function GET(request: Request) {
  if (FAMILY_LAUNCH_PENDING) {
    return NextResponse.redirect(`${SITE_URL}/family?status=launch-pending`, { status: 303 });
  }
  try {
    const q = validateQuery(request, FamilyCheckoutQuerySchema);
    if (!q.ok) {
      return NextResponse.redirect(`${SITE_URL}/family?error=invalid-plan`, { status: 303 });
    }
    const { plan } = q.data;

    const session = await createFamilyCheckoutSession({
      plan,
      successUrl: `${SITE_URL}/family/bienvenue?plan=${plan}`,
      cancelUrl: `${SITE_URL}/family?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.redirect(`${SITE_URL}/family?error=session-url-missing`, { status: 303 });
    }
    await trackFamilyAttempt(session.id, plan);
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[stripe/checkout-family GET]", message);
    return NextResponse.redirect(`${SITE_URL}/family?error=checkout-failed`, { status: 303 });
  }
}

export async function POST(request: Request) {
  if (FAMILY_LAUNCH_PENDING) {
    return NextResponse.json(
      { error: "Family launch pending (Apple iOS validation in progress)" },
      { status: 503 }
    );
  }
  try {
    const v = await validateBody(request, FamilyCheckoutSchema);
    if (!v.ok) return v.response;
    const { plan, email } = v.data;

    const session = await createFamilyCheckoutSession({
      plan,
      customerEmail: email,
      successUrl: `${SITE_URL}/family/bienvenue?plan=${plan}`,
      cancelUrl: `${SITE_URL}/family?checkout=cancelled`,
    });

    await trackFamilyAttempt(session.id, plan, email ?? null);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[stripe/checkout-family]", message);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement" },
      { status: 500 }
    );
  }
}
