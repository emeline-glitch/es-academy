import crypto from "node:crypto";

/**
 * Verification cryptographique de la signature SNS.
 *
 * Doc AWS : https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 *
 * Etapes :
 *   1. SigningCertURL doit etre un URL Amazon SNS (https + sns.*.amazonaws.com)
 *   2. Fetch le certificat
 *   3. Construire la "string to sign" canonique (ordre et format strict)
 *   4. Verifier la signature RSA avec le cert (SHA1 ou SHA256 selon SignatureVersion)
 *
 * Sans cette verification, n'importe qui devinant l'URL du webhook peut nous
 * envoyer de faux bounces / complaints et bricoler notre base contacts.
 */

export type SnsMessageForSignature = {
  Type: "SubscriptionConfirmation" | "Notification" | "UnsubscribeConfirmation";
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  Subject?: string;
  Token?: string;
  SubscribeURL?: string;
};

/**
 * Valide qu'un SigningCertURL est bien un endpoint AWS SNS legitime :
 *   - protocole https
 *   - host se termine par .amazonaws.com
 *   - host commence par "sns." (ex: sns.eu-west-3.amazonaws.com)
 *
 * Refuser un certURL hors AWS empeche un attaquant de forger une signature
 * avec son propre cert auto-genere et de nous faire matcher.
 */
export function isValidSnsCertUrl(certUrlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(certUrlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (!parsed.hostname.endsWith(".amazonaws.com")) return false;
  if (!/^sns\./.test(parsed.hostname)) return false;
  return true;
}

/**
 * Construit la "string to sign" canonique selon les regles AWS.
 *
 * Format strict : champ + \n + valeur + \n, repete dans un ORDRE precis qui
 * differe selon le Type. L'absence/presence de "Subject" pour Notification
 * est normatives (omise quand absente).
 */
export function buildStringToSign(message: SnsMessageForSignature): string {
  const lines: string[] = [];

  if (message.Type === "Notification") {
    lines.push("Message", message.Message);
    lines.push("MessageId", message.MessageId);
    if (message.Subject !== undefined) {
      lines.push("Subject", message.Subject);
    }
    lines.push("Timestamp", message.Timestamp);
    lines.push("TopicArn", message.TopicArn);
    lines.push("Type", message.Type);
  } else {
    if (!message.Token || !message.SubscribeURL) {
      throw new Error("Missing Token or SubscribeURL on confirmation message");
    }
    lines.push("Message", message.Message);
    lines.push("MessageId", message.MessageId);
    lines.push("SubscribeURL", message.SubscribeURL);
    lines.push("Timestamp", message.Timestamp);
    lines.push("Token", message.Token);
    lines.push("TopicArn", message.TopicArn);
    lines.push("Type", message.Type);
  }

  return lines.join("\n") + "\n";
}

/**
 * Verifie la signature d'un message SNS. Retourne false si :
 *   - certURL hors domaine AWS SNS
 *   - certificat introuvable (fetch != 200)
 *   - signature absente
 *   - signature ne matche pas le cert + string canonique
 *
 * Accepte un fetcher injectable pour tests unitaires (par defaut : fetch global).
 */
export async function verifySnsSignature(
  message: SnsMessageForSignature,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!message.Signature || !message.SigningCertURL) return false;
  if (!isValidSnsCertUrl(message.SigningCertURL)) return false;

  const response = await fetcher(message.SigningCertURL);
  if (!response.ok) return false;
  const certPem = await response.text();

  let stringToSign: string;
  try {
    stringToSign = buildStringToSign(message);
  } catch {
    return false;
  }

  // SignatureVersion "1" = RSA-SHA1 (legacy par defaut SNS)
  // SignatureVersion "2" = RSA-SHA256 (opt-in cote topic depuis 2022)
  const algo = message.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1";

  const verifier = crypto.createVerify(algo);
  verifier.update(stringToSign, "utf-8");
  const signature = Buffer.from(message.Signature, "base64");
  try {
    return verifier.verify(certPem, signature);
  } catch {
    return false;
  }
}
