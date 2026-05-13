import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { createServiceClient } from "@/lib/supabase/server";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  /**
   * Pour emails admin internes (healthcheck, alertes monitoring) : ne pas
   * marquer le destinataire en 'bounced' si SES rejette pour cause de
   * suppression list. Evite de laisser un admin invisible dans la base.
   */
  skipSuppressionCheck?: boolean;
}

/**
 * Quand AWS SES retourne MessageRejected avec un message indiquant que
 * l'email est dans la liste de suppression au niveau du compte (hard bounce
 * ou complaint passes), on marque le contact en 'bounced' (le RPC
 * get_pending_sequence_sends filtre deja sur status='active', donc le contact
 * est exclu des sequences). Audit log systematique pour tracabilite.
 *
 * On preserve 'unsubscribed' (RGPD opt-out explicite > technicalite bounce).
 */
async function markSesSuppressed(email: string, reason: string): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const emailLower = email.toLowerCase();

    await supabase
      .from("contacts")
      .update({ status: "bounced" })
      .eq("email", emailLower)
      .neq("status", "unsubscribed");

    await supabase.from("audit_log").insert({
      action: "ses_suppression_list_hit",
      entity_type: "contact",
      after: { email: emailLower, reason },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[SES] markSesSuppressed failed:", msg);
  }
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
  skipSuppressionCheck,
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
    const err = error as { name?: string; message?: string };
    const errName = err.name || "";
    const errMessage = err.message || String(error);

    // AWS SES retourne MessageRejected quand l'email est dans la liste de
    // suppression au niveau du compte (hard bounce ou complaint passes).
    // Message type : "Email address is suppressed for this account, reason: BOUNCE"
    // ou "Address blocked: Email address is on the suppression list".
    // On marque le contact bounced pour qu'il soit exclu des prochaines
    // sequences (RPC get_pending_sequence_sends filtre sur status='active').
    const isSuppressed =
      errName === "MessageRejected" &&
      /suppression list|address is suppressed/i.test(errMessage);

    if (isSuppressed && recipients.length === 1 && !skipSuppressionCheck) {
      await markSesSuppressed(recipients[0], errMessage);
    }

    console.error("[SES] send error:", errName, errMessage);
    return { success: false, error: errMessage };
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
