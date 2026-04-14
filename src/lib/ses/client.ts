interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const region = process.env.AWS_SES_REGION || "eu-west-3";
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  const fromEmail = from || `${process.env.SES_FROM_NAME || "Emeline Siron"} <${process.env.SES_FROM_EMAIL || "contact@es-academy.fr"}>`;

  if (!accessKeyId || !secretAccessKey) {
    console.warn("AWS SES credentials not configured, skipping email send");
    return { success: false, error: "SES not configured" };
  }

  const recipients = Array.isArray(to) ? to : [to];

  // Use AWS SES v2 SendEmail API via fetch (no AWS SDK dependency)
  const endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;

  const body = JSON.stringify({
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    },
    Destination: {
      ToAddresses: recipients,
    },
    FromEmailAddress: fromEmail,
    ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
  });

  try {
    // For now, use a simpler SMTP approach via SES SMTP interface
    // The full AWS Signature v4 signing is complex — we'll use @aws-sdk/client-ses when installed
    // For development, this is a placeholder
    console.log(`[SES] Would send email to ${recipients.join(", ")}: ${subject}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  } catch (error) {
    console.error("SES send error:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // SES allows 50 recipients per batch in production
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const emails = batch.map((r) => r.email);

    const result = await sendEmail({ to: emails, subject, html });
    if (result.success) {
      sent += batch.length;
    } else {
      failed += batch.length;
    }
  }

  return { sent, failed };
}
