import { getStripe } from "./client";

interface AcademyCheckoutParams {
  plan: "1x" | "3x" | "4x";
  successUrl: string;
  cancelUrl: string;
}

const ACADEMY_PRICES = {
  "1x": {
    env: "STRIPE_PRICE_ACADEMY_1X",
    mode: "payment" as const,
    installments: 1,
  },
  "3x": {
    env: "STRIPE_PRICE_ACADEMY_3X",
    mode: "subscription" as const,
    installments: 3,
  },
  "4x": {
    env: "STRIPE_PRICE_ACADEMY_4X",
    mode: "subscription" as const,
    installments: 4,
  },
};

export async function createAcademyCheckoutSession({
  plan,
  successUrl,
  cancelUrl,
}: AcademyCheckoutParams) {
  const cfg = ACADEMY_PRICES[plan];
  const priceId = process.env[cfg.env];
  if (!priceId) {
    throw new Error(`Prix Academy ${plan} non configuré (${cfg.env})`);
  }

  const stripe = getStripe();

  const metadata = {
    scope: "academy",
    course_id: "methode-emeline-siron",
    product_name: "academy-formation",
    plan,
    installments: String(cfg.installments),
  };

  if (cfg.mode === "payment") {
    return stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: false,
    });
  }

  // Mode subscription pour 3x/4x : on crée un abo mensuel et dans le webhook
  // on set cancel_at pour que Stripe arrête automatiquement après N paiements.
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: {
      metadata,
      description: `Academy - paiement en ${cfg.installments} fois`,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: false,
  });
}
