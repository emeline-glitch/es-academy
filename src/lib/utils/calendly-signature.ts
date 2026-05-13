import crypto from "node:crypto";

/**
 * Verification HMAC-SHA256 des webhooks Calendly v2.
 *
 * Calendly envoie un header `Calendly-Webhook-Signature: t=<unix_ts>,v1=<hex_hmac>`.
 * Le payload signe est `${t}.${rawBody}` (timestamp + point + corps brut JSON).
 *
 * Le timestamp protege contre les replays : si Calendly diffuse a nouveau un
 * vieux payload (acteur malveillant qui aurait sniffe la requete), on rejette
 * apres 5 min de tolerance.
 */

const TOLERANCE_SECONDS = 5 * 60;

export type CalendlyVerification =
  | { valid: true }
  | { valid: false; reason: string };

export function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): CalendlyVerification {
  if (!signatureHeader) return { valid: false, reason: "missing_header" };
  if (!signingKey) return { valid: false, reason: "missing_signing_key" };

  const parts: Record<string, string> = {};
  for (const segment of signatureHeader.split(",")) {
    const idx = segment.indexOf("=");
    if (idx === -1) continue;
    const k = segment.slice(0, idx).trim();
    const v = segment.slice(idx + 1).trim();
    if (k && v) parts[k] = v;
  }

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { valid: false, reason: "malformed_header" };

  const timestamp = Number.parseInt(t, 10);
  if (!Number.isFinite(timestamp)) return { valid: false, reason: "invalid_timestamp" };
  if (Math.abs(nowSeconds - timestamp) > TOLERANCE_SECONDS) {
    return { valid: false, reason: "timestamp_out_of_tolerance" };
  }

  if (!/^[a-f0-9]+$/i.test(v1)) return { valid: false, reason: "invalid_hex" };

  const signedPayload = `${t}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", signingKey)
    .update(signedPayload)
    .digest("hex");

  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return { valid: false, reason: "length_mismatch" };
  if (!crypto.timingSafeEqual(a, b)) return { valid: false, reason: "signature_mismatch" };

  return { valid: true };
}
