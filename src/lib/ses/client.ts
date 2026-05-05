import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

// Singleton client réutilisé par toutes les invocations serverless (cache de connexion TLS)
let _client: SESv2Client | null = null;
function getClient(): SESv2Client {
  if (_client) return _client;
  const region = process.env.AWS_SES_REGION || "eu-west-3";
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS SES credentials not configured (AWS_SES_ACCESS_KEY_ID / AWS_SES_SECRET_ACCESS_KEY manquantes)");
  }
  _client = new SESv2Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/**
 * Envoie un email via AWS SES v2.
 *
 * Anciennement un stub (console.log puis return success=true sans envoi réel) : c'est pour ça
 * qu'aucun mail n'était envoyé en vrai malgré des logs "sent". Corrigé ici avec @aws-sdk/client-sesv2.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    console.warn("[SES] credentials not configured, skipping email send");
    return { success: false, error: "SES not configured" };
  }

  const fromEmail =
    from ||
    `${process.env.SES_FROM_NAME || "Emeline Siron"} <${process.env.SES_FROM_EMAIL || "emeline@emeline-siron.fr"}>`;
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const client = getClient();
    const cmd = new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: { ToAddresses: recipients },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      },
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
    });
    const res = await client.send(cmd);
    return { success: true, messageId: res.MessageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SES] send error:", msg);
    return { success: false, error: msg };
  }
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // SES n'accepte qu'UN destinataire par SendEmail. Pour du bulk : BatchSendEmail (pas encore implémenté)
  // ou en parallèle par chunks. Ici : chunks de 10 en parallèle pour respecter le rate standard (14/sec).
  const CHUNK = 10;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const batch = recipients.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      batch.map((r) => sendEmail({ to: r.email, subject, html }))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) sent++;
      else failed++;
    }
  }

  return { sent, failed };
}
