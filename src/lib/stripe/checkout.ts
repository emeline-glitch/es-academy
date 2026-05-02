import { getStripe } from "./client";

interface AcademyCheckoutParams {
  plan: "1x" | "3x" | "4x";
  successUrl: string;
  cancelUrl: string;
}

interface FamilyCheckoutParams {
  plan: "fondateur" | "standard";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
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

const FAMILY_PRICES = {
  fondateur: {
    env: "STRIPE_PRICE_FAMILY_FONDATEUR",
    label: "ES Family - tarif fondateur (19 €/mois)",
    productName: "family-fondateur",
  },
  standard: {
    env: "STRIPE_PRICE_FAMILY_STANDARD",
    label: "ES Family - tarif standard (29 €/mois)",
    productName: "family-standard",
  },
};

/**
 * Crée une session Stripe Checkout pour un abonnement ES Family.
 * Mode subscription (mensuel récurrent), accepte les codes promo (parrainage,
 * coupon alumni Evermind via STRIPE_COUPON_ALUMNI_GIFT).
 *
 * Le tarif fondateur est plafonné à 500 places via STRIPE_FAMILY_FONDATEUR_CAP.
 * Le webhook stripe peut décompter et basculer en standard une fois le cap atteint.
 */
export async function createFamilyCheckoutSession({
  plan,
  successUrl,
  cancelUrl,
  customerEmail,
}: FamilyCheckoutParams) {
  const cfg = FAMILY_PRICES[plan];
  const priceId = process.env[cfg.env];
  if (!priceId) {
    throw new Error(`Prix Family ${plan} non configuré (${cfg.env})`);
  }

  const stripe = getStripe();

  const metadata = {
    scope: "family",
    product_name: cfg.productName,
    plan,
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: {
      metadata,
      description: cfg.label,
    },
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Accepte EVERMIND (alumni) + autres promo codes parrainage
    allow_promotion_codes: true,
  });
}
