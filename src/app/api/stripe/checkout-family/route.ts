import { NextResponse } from "next/server";
import { createFamilyCheckoutSession } from "@/lib/stripe/checkout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * GET /api/stripe/checkout-family?plan=fondateur
 * Cree une session Stripe et redirige (303) vers la page Stripe Checkout.
 * Utilisable directement dans un <a href="..."> ou MobileCta.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plan = (url.searchParams.get("plan") || "fondateur") as "fondateur" | "standard";

    if (plan !== "fondateur" && plan !== "standard") {
      return NextResponse.redirect(`${SITE_URL}/family?error=invalid-plan`, { status: 303 });
    }

    const session = await createFamilyCheckoutSession({
      plan,
      successUrl: `${SITE_URL}/family/bienvenue?plan=${plan}`,
      cancelUrl: `${SITE_URL}/family?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.redirect(`${SITE_URL}/family?error=session-url-missing`, { status: 303 });
    }
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[stripe/checkout-family GET]", message);
    return NextResponse.redirect(`${SITE_URL}/family?error=checkout-failed`, { status: 303 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const plan = body?.plan || "fondateur";
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;

    if (plan !== "fondateur" && plan !== "standard") {
      return NextResponse.json(
        { error: "Plan invalide (attendu : fondateur ou standard)" },
        { status: 400 }
      );
    }

    const session = await createFamilyCheckoutSession({
      plan,
      customerEmail: email,
      successUrl: `${SITE_URL}/family/bienvenue?plan=${plan}`,
      cancelUrl: `${SITE_URL}/family?checkout=cancelled`,
    });

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
