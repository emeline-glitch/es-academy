import { randomBytes } from "node:crypto";
import { getStripe } from "./client";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I for readability
const CODE_SUFFIX_LENGTH = 4;

function randomSuffix(): string {
  const bytes = randomBytes(CODE_SUFFIX_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_SUFFIX_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Génère un Promotion Code Stripe unique enfant du coupon parent
 * ACADEMY_3_MOIS_FAMILY, lisible par un humain (ex: FAMILY7K2P).
 *
 * - `max_redemptions=1` garantit que le code est utilisable une seule fois
 *   (suffit pour empêcher le partage entre clients).
 * - `expires_at` à 90 jours : pousse l'utilisation rapide tout en laissant une
 *   fenêtre confortable. Sans expiration, des codes traînent indéfiniment dans
 *   les inbox.
 * - PAS de binding `customer` : risque trop élevé qu'un client utilise un email
 *   différent entre l'achat Academy et l'abonnement Family (perso vs pro etc).
 *   Le `max_redemptions=1` reste le garde-fou anti-partage.
 *
 * En cas de collision sur le code random (très rare vu l'entropie), on retente 5x.
 */
export async function createFamilyGiftPromotionCode(params: {
  email: string;
  sourceSessionId: string;
}): Promise<{ code: string; promoId: string }> {
  const stripe = getStripe();
  const parentCoupon =
    process.env.STRIPE_COUPON_ACADEMY_GIFT || "ACADEMY_3_MOIS_FAMILY";

  // Expiration à J+90 (timestamp Unix en secondes, format Stripe).
  const expiresAt = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `FAMILY${randomSuffix()}`;
    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: parentCoupon },
        code,
        max_redemptions: 1,
        expires_at: expiresAt,
        metadata: {
          scope: "family",
          trigger: "academy_purchase",
          email: params.email,
          source_session: params.sourceSessionId,
        },
      });
      return { code: promo.code, promoId: promo.id };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!message.toLowerCase().includes("already")) throw err;
    }
  }
  throw new Error(
    `Impossible de générer un code gift Family unique: ${String(lastError)}`
  );
}
