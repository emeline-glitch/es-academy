import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";

// ARN attendus pour les 2 topics SES (bounces + complaints). Si le message
// arrive sur un autre TopicArn, on refuse 403. Configures dans .env :
//   AWS_SNS_TOPIC_ARN_BOUNCES=arn:aws:sns:eu-west-3:...:ses-bounce-notifications
//   AWS_SNS_TOPIC_ARN_COMPLAINTS=arn:aws:sns:eu-west-3:...:ses-complaint-notifications
const BOUNCE_ARN = process.env.AWS_SNS_TOPIC_ARN_BOUNCES;
const COMPLAINT_ARN = process.env.AWS_SNS_TOPIC_ARN_COMPLAINTS;

type SnsMessage = {
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
  UnsubscribeURL?: string;
};

type BouncedRecipient = {
  emailAddress: string;
  status?: string;
  diagnosticCode?: string;
};

type SesBouncePayload = {
  notificationType: "Bounce";
  bounce: {
    bounceType: "Permanent" | "Transient" | "Undetermined";
    bounceSubType?: string;
    bouncedRecipients: BouncedRecipient[];
    timestamp: string;
    feedbackId: string;
  };
  mail: { source: string; messageId: string; timestamp: string };
};

type SesComplaintPayload = {
  notificationType: "Complaint";
  complaint: {
    complainedRecipients: Array<{ emailAddress: string }>;
    timestamp: string;
    feedbackId: string;
    complaintFeedbackType?: string;
  };
  mail: { source: string; messageId: string; timestamp: string };
};

export async function POST(request: Request) {
  // 1. Parse body. SNS envoie du JSON mais sans le bon Content-Type, donc on
  //    lit en text et on parse manuellement.
  const bodyText = await request.text();
  let snsMessage: SnsMessage;
  try {
    snsMessage = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Filtre rapide : TopicArn doit matcher l'un de nos 2 topics connus.
  const validArns = [BOUNCE_ARN, COMPLAINT_ARN].filter(Boolean) as string[];
  if (!validArns.includes(snsMessage.TopicArn)) {
    console.warn("[sns] TopicArn inconnu rejete:", snsMessage.TopicArn);
    return NextResponse.json({ error: "Unknown topic" }, { status: 403 });
  }

  // 3. Verification cryptographique de la signature SNS.
  //    Sans ca, n'importe qui devinant l'URL peut nous envoyer de faux bounces.
  try {
    const valid = await verifySnsSignature(snsMessage);
    if (!valid) {
      console.error("[sns] signature invalide pour MessageId", snsMessage.MessageId);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[sns] verifySnsSignature failed:", msg);
    return NextResponse.json({ error: "Signature verification error" }, { status: 500 });
  }

  // 4. SubscriptionConfirmation : SNS nous envoie ca 1 fois apres avoir
  //    cree la subscription HTTPS. On doit GET le SubscribeURL pour confirmer.
  if (snsMessage.Type === "SubscriptionConfirmation") {
    if (!snsMessage.SubscribeURL) {
      return NextResponse.json({ error: "Missing SubscribeURL" }, { status: 400 });
    }
    try {
      await fetch(snsMessage.SubscribeURL);
      console.log("[sns] subscription confirmee pour", snsMessage.TopicArn);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error("[sns] subscription confirm fetch failed:", msg);
      // 200 quand meme : AWS va retry si on renvoie 5xx, et de toute facon
      // un autre admin peut confirmer manuellement depuis la console SNS.
    }
    return NextResponse.json({ received: true, action: "subscribed" });
  }

  // 5. UnsubscribeConfirmation : envoye quand quelqu'un desabonne le topic.
  //    Pas d'action attendue de notre cote, on log juste.
  if (snsMessage.Type === "UnsubscribeConfirmation") {
    console.warn("[sns] UnsubscribeConfirmation recu pour", snsMessage.TopicArn);
    return NextResponse.json({ received: true, action: "unsubscribed" });
  }

  // 6. Notification : c'est le cas qui nous interesse.
  if (snsMessage.Type !== "Notification") {
    return NextResponse.json({ received: true, ignored: true });
  }

  // Idempotence : on note le MessageId, si deja present (23505) on skip.
  const supabase = await createServiceClient();
  const { error: dedupErr } = await supabase
    .from("processed_sns_messages")
    .insert({
      message_id: snsMessage.MessageId,
      topic_arn: snsMessage.TopicArn,
      notification_type: snsMessage.Type,
    });
  if (dedupErr && dedupErr.code === "23505") {
    console.log("[sns] message deja traite, skip:", snsMessage.MessageId);
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (dedupErr) {
    console.error("[sns] dedup insert error:", dedupErr.message);
    // On continue : pire cas, doublon dans audit_log au prochain retry SNS.
  }

  // Parse le payload SES.
  let sesMessage: SesBouncePayload | SesComplaintPayload;
  try {
    sesMessage = JSON.parse(snsMessage.Message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[sns] SES Message JSON parse failed:", msg);
    return NextResponse.json({ received: true, error: "parse_failed" });
  }

  try {
    if (sesMessage.notificationType === "Bounce") {
      await handleBounce(supabase, sesMessage, snsMessage.MessageId);
    } else if (sesMessage.notificationType === "Complaint") {
      await handleComplaint(supabase, sesMessage, snsMessage.MessageId);
    } else {
      const unknown = (sesMessage as { notificationType?: string; eventType?: string }).notificationType
        ?? (sesMessage as { eventType?: string }).eventType
        ?? "(absent)";
      console.warn("[sns] notificationType inconnu:", unknown);
      // Debug : stocke le payload entier pour comprendre le format envoye par SES
      await supabase.from("audit_log").insert({
        action: "sns_unknown_type",
        entity_type: "sns_message",
        after: {
          sns_message_id: snsMessage.MessageId,
          topic_arn: snsMessage.TopicArn,
          detected_type: unknown,
          raw_payload: sesMessage,
        },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[sns] handler failed:", msg);
    // 200 quand meme : on a deja note le MessageId en dedup. Si on renvoie
    // 5xx, AWS retry et au prochain coup on hit le 23505 = on skip sans
    // jamais re-tenter le handler. Donc on log l'erreur ici et on accept.
  }

  return NextResponse.json({ received: true });
}

// SES envoie pour chaque destinataire qui a hard-bounce (Permanent) ou soft-bounce
// (Transient/Undetermined). On exclut definitivement uniquement sur Permanent.
async function handleBounce(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  sesMessage: SesBouncePayload,
  snsMessageId: string,
) {
  const bounce = sesMessage.bounce;
  const isPermanent = bounce.bounceType === "Permanent";

  for (const recipient of bounce.bouncedRecipients) {
    const email = recipient.emailAddress.toLowerCase();

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (isPermanent) {
      if (contact?.id) {
        await supabase
          .from("contacts")
          .update({ status: "bounced" })
          .eq("id", contact.id);

        await supabase.from("consent_log").insert({
          contact_id: contact.id,
          consent_type: "bounce_exclusion",
          consent_basis: "ses_hard_bounce",
          consent_proof: {
            sns_message_id: snsMessageId,
            feedback_id: bounce.feedbackId,
            bounce_type: bounce.bounceType,
            bounce_sub_type: bounce.bounceSubType,
            diagnostic_code: recipient.diagnosticCode,
            status: recipient.status,
            ses_timestamp: bounce.timestamp,
            mail_source: sesMessage.mail.source,
            mail_message_id: sesMessage.mail.messageId,
          },
        });
      }

      await supabase.from("audit_log").insert({
        action: "sns_bounce_hard",
        entity_type: "contact",
        entity_id: contact?.id ?? null,
        after: {
          email,
          contact_existed: Boolean(contact?.id),
          bounce_sub_type: bounce.bounceSubType,
          diagnostic_code: recipient.diagnosticCode,
          feedback_id: bounce.feedbackId,
          mail_message_id: sesMessage.mail.messageId,
        },
      });
    } else {
      // Soft bounce : on log seulement, pas d'exclusion. Si le pattern se
      // repete (genre 3 soft bounces sur 7 jours), on pourra escalader plus tard.
      await supabase.from("audit_log").insert({
        action: "sns_bounce_transient",
        entity_type: "contact",
        entity_id: contact?.id ?? null,
        after: {
          email,
          bounce_type: bounce.bounceType,
          bounce_sub_type: bounce.bounceSubType,
          diagnostic_code: recipient.diagnosticCode,
          feedback_id: bounce.feedbackId,
          mail_message_id: sesMessage.mail.messageId,
        },
      });
    }
  }
}

// Complaint = plainte spam. Plus fort qu'un bounce : c'est un opt-out
// explicite. On marque unsubscribed (et non bounced) pour ne pas le confondre
// avec une adresse morte.
async function handleComplaint(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  sesMessage: SesComplaintPayload,
  snsMessageId: string,
) {
  const complaint = sesMessage.complaint;

  for (const recipient of complaint.complainedRecipients) {
    const email = recipient.emailAddress.toLowerCase();

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (contact?.id) {
      await supabase
        .from("contacts")
        .update({ status: "unsubscribed" })
        .eq("id", contact.id);

      await supabase.from("consent_log").insert({
        contact_id: contact.id,
        consent_type: "opt_out",
        consent_basis: "ses_complaint",
        consent_proof: {
          sns_message_id: snsMessageId,
          feedback_id: complaint.feedbackId,
          complaint_feedback_type: complaint.complaintFeedbackType,
          ses_timestamp: complaint.timestamp,
          mail_source: sesMessage.mail.source,
          mail_message_id: sesMessage.mail.messageId,
        },
      });
    }

    await supabase.from("audit_log").insert({
      action: "sns_complaint",
      entity_type: "contact",
      entity_id: contact?.id ?? null,
      after: {
        email,
        contact_existed: Boolean(contact?.id),
        complaint_feedback_type: complaint.complaintFeedbackType,
        feedback_id: complaint.feedbackId,
        mail_message_id: sesMessage.mail.messageId,
      },
    });
  }
}

// Verification cryptographique de la signature SNS.
// Doc : https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
//
// Etapes :
//   1. SigningCertURL doit etre un URL Amazon SNS (https + sns.*.amazonaws.com)
//   2. Fetch le certificat
//   3. Construire la "string to sign" canonique (ordre + format strict)
//   4. Verifier la signature RSA avec le cert (SHA1 ou SHA256 selon SignatureVersion)
async function verifySnsSignature(message: SnsMessage): Promise<boolean> {
  const certUrl = new URL(message.SigningCertURL);
  if (certUrl.protocol !== "https:") return false;
  if (!certUrl.hostname.endsWith(".amazonaws.com")) return false;
  if (!/^sns\./.test(certUrl.hostname)) return false;

  const response = await fetch(message.SigningCertURL);
  if (!response.ok) return false;
  const certPem = await response.text();

  const stringToSign = buildStringToSign(message);

  // SignatureVersion "1" = RSA-SHA1 (legacy par defaut SNS)
  // SignatureVersion "2" = RSA-SHA256 (opt-in cote topic depuis 2022)
  const algo = message.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1";

  const verifier = crypto.createVerify(algo);
  verifier.update(stringToSign, "utf-8");
  const signature = Buffer.from(message.Signature, "base64");
  return verifier.verify(certPem, signature);
}

function buildStringToSign(message: SnsMessage): string {
  // Format strict impose par AWS : nom du champ + valeur, separe par \n, et un \n final.
  // L'ordre et la presence/absence de "Subject" sont normatifs.
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
