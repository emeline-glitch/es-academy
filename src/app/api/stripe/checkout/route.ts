import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/checkout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product } = body;

    let priceId: string;
    let productName: string;
    let courseId: string;

    if (product === "formation") {
      priceId = process.env.STRIPE_PRICE_FORMATION!;
      productName = "formation";
      courseId = "methode-emeline-siron";
    } else if (product === "expert") {
      priceId = process.env.STRIPE_PRICE_EXPERT!;
      productName = "expert";
      courseId = "methode-emeline-siron";
    } else {
      return NextResponse.json({ error: "Produit invalide" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Prix Stripe non configure" },
        { status: 500 }
      );
    }

    const session = await createCheckoutSession({
      priceId,
      productName,
      courseId,
      successUrl: `${SITE_URL}/connexion?checkout=success`,
      cancelUrl: `${SITE_URL}/?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement" },
      { status: 500 }
    );
  }
}
