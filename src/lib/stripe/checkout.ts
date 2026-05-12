import { getStripe } from "./client";

interface AcademyCheckoutParams {
  plan: "1x" | "3x" | "4x";
  successUrl: string;
  cancelUrl: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";

/**
 * Texte affiche au-dessus de la case ToS obligatoire de Stripe Checkout.
 * Combine 2 acceptations RGPD/L221-28-13° en une seule case :
 *   1. Acceptation des CGV (Stripe affiche par defaut un lien CGV)
 *   2. Renonciation expresse au droit de retractation 14j (L221-28 13°)
 *
 * Sans cette renonciation, un acheteur Academy a 14j pour demander
 * remboursement meme apres avoir consomme la formation = perte 998 EUR.
 * La case est checkbox obligatoire = bloque le paiement si decochee.
 *
 * Stripe ne supporte que du markdown basique (**bold**, [link](url)).
 */
const ACADEMY_TOS_MESSAGE =
  "Je reconnais avoir lu et accepte les **conditions generales de vente** " +
  "([CGV](" + SITE_URL + "/cgv)) et **je renonce expressement a mon droit de " +
  "retractation de 14 jours** (article L221-28 13 du Code de la consommation) " +
  "afin de beneficier d'un acces immediat a la formation des reception du paiement. " +
  "Sans cette renonciation, l'acces est differe a la fin du delai legal.";

const FAMILY_TOS_MESSAGE =
  "Je reconnais avoir lu et accepte les **conditions generales de vente** " +
  "([CGV](" + SITE_URL + "/cgv)) et **je renonce expressement a mon droit de " +
  "retractation de 14 jours** (article L221-28 1 du Code de la consommation) " +
  "afin d'acceder immediatement a la communaute ES Family des l'activation de l'abonnement.";

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

  // Case ToS obligatoire combinant acceptation CGV + renonciation retractation
  // 14j (L221-28 13). Stripe stocke l'acceptation dans session.consent.terms_of_service,
  // qu'on logge dans consent_log cote webhook pour preuve RGPD.
  const consentCollection = { terms_of_service: "required" as const };
  const customText = {
    terms_of_service_acceptance: { message: ACADEMY_TOS_MESSAGE },
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
      consent_collection: consentCollection,
      custom_text: customText,
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
    consent_collection: consentCollection,
    custom_text: customText,
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
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: { message: FAMILY_TOS_MESSAGE },
    },
  });
}
