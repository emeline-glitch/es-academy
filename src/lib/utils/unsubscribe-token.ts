import crypto from "node:crypto";

/**
 * Token unsubscribe HMAC-SHA256 pour conformite RGPD + anti revenge-unsubscribe.
 *
 * Avant : POST /api/contacts/unsubscribe acceptait { email } sans verification.
 * N'importe qui connaissant l'email d'un client pouvait le desabonner (revenge,
 * sabotage concurrentiel, etc.). Non conforme article 21 RGPD qui exige une
 * "manifestation de volonte" verifiable.
 *
 * Maintenant : chaque lien unsubscribe inclut un token = HMAC-SHA256(email,
 * SECRET). Seul le destinataire legitime du mail recoit ce token et peut donc
 * declencher l'unsubscribe en 1-click. Si quelqu'un connait juste l'email mais
 * pas le token, il doit passer par le formulaire manuel + confirmation par
 * mail (preuve de possession de la boite).
 *
 * Pas de TTL volontairement : un lien unsubscribe doit rester valide aussi
 * longtemps que l'email est en base, sinon on contraint le destinataire a
 * demander un nouveau lien chaque fois qu'il veut sortir = mauvaise UX et
 * non-conformite ePrivacy.
 *
 * Si compromission du SECRET : rotater la valeur de UNSUBSCRIBE_SECRET. Les
 * anciens liens deviennent invalides, on bascule sur le path manuel pendant
 * la transition.
 */

const SECRET_ENV = "UNSUBSCRIBE_SECRET";

function getSecret(): string {
  const secret = process.env[SECRET_ENV];
  if (!secret || secret.length < 16) {
    throw new Error(
      `${SECRET_ENV} manquant ou trop court (min 16 chars). Generer via: openssl rand -hex 32`
    );
  }
  return secret;
}

/**
 * Genere un token HMAC pour l'email donne.
 * Format : hex string de 64 chars (SHA-256 = 32 bytes * 2).
 */
export function generateUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHmac("sha256", getSecret()).update(normalized).digest("hex");
}

/**
 * Verifie qu'un token correspond a l'email. Compare en temps constant
 * pour eviter les timing attacks (Buffer.from + crypto.timingSafeEqual).
 *
 * Retourne false en cas de format invalide (longueur, hex) plutot que throw.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (typeof token !== "string" || token.length !== 64) return false;
  if (!/^[a-f0-9]{64}$/.test(token)) return false;

  let expected: string;
  try {
    expected = generateUnsubscribeToken(email);
  } catch {
    return false;
  }

  const a = Buffer.from(token, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Helper pour construire l'URL complete a inclure dans les templates email.
 * Utilise SITE_URL pour pointer vers la prod (pas localhost).
 */
export function buildUnsubscribeUrl(email: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
  const token = generateUnsubscribeToken(email);
  return `${siteUrl}/desabonnement?email=${encodeURIComponent(email)}&token=${token}`;
}
