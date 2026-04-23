import { NextResponse } from "next/server";
import { createAcademyCheckoutSession } from "@/lib/stripe/checkout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = body?.plan;

    if (plan !== "1x" && plan !== "3x" && plan !== "4x") {
      return NextResponse.json(
        { error: "Plan invalide (attendu: 1x, 3x ou 4x)" },
        { status: 400 }
      );
    }

    const session = await createAcademyCheckoutSession({
      plan,
      successUrl: `${SITE_URL}/connexion?checkout=success&plan=${plan}`,
      cancelUrl: `${SITE_URL}/academy?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // On ne log que le message (pas l'objet complet Stripe qui contient
    // requestId + détails de payload qui peuvent matérialiser des données
    // clients en clair dans les logs Netlify).
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[stripe/checkout]", message);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
