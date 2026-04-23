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
 * max_redemptions=1 garantit que le code est utilisable une seule fois.
 * En cas de collision (très rare vu l'entropie), on retente 5x.
 */
export async function createFamilyGiftPromotionCode(params: {
  stripeCustomerId: string | null;
  email: string;
  sourceSessionId: string;
}): Promise<{ code: string; promoId: string }> {
  const stripe = getStripe();
  const parentCoupon =
    process.env.STRIPE_COUPON_ACADEMY_GIFT || "ACADEMY_3_MOIS_FAMILY";

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `FAMILY${randomSuffix()}`;
    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: parentCoupon },
        code,
        max_redemptions: 1,
        ...(params.stripeCustomerId
          ? { customer: params.stripeCustomerId }
          : {}),
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
