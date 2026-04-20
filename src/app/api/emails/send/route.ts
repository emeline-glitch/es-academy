import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import { applyTracking } from "@/lib/email/tracking";

// Parallélise l'envoi par paquets pour éviter le timeout Netlify (~10s)
// sur des campagnes > 50 contacts, tout en respectant les quotas SES (~14/s en sandbox, 50/s en prod).
const BATCH_SIZE = 10;

interface SendableContact {
  id: string;
  email: string;
  first_name: string | null;
  tags: string[] | null;
}

export async function POST(request: Request) {
  // Auth via cookies (createServiceClient bypasse RLS mais n'a plus de cookies)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const body = await request.json();
  const { campaign_id, target_tags } = body;

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id requis" }, { status: 400 });
  }

  // Fetch campaign
  const { data: campaign, error: campError } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  // Fetch active contacts
  const { data: allContacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, email, first_name, tags")
    .eq("status", "active");

  if (contactsError || !allContacts) {
    return NextResponse.json({ error: "Erreur contacts" }, { status: 500 });
  }

  // Filter by tags (OR logic: contact matches if it has ANY of the selected tags)
  let contacts: SendableContact[] = allContacts as SendableContact[];
  if (Array.isArray(target_tags) && target_tags.length > 0) {
    contacts = contacts.filter((c) => {
      const contactTags = c.tags || [];
      return target_tags.some((tag: string) => contactTags.includes(tag));
    });
  }

  if (contacts.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
      warning: "Aucun contact ne correspond aux tags ciblés",
    });
  }

  // Envoi batché parallèle — retourne une liste d'erreurs détaillée pour débogage
  let sentCount = 0;
  let failedCount = 0;
  const failures: Array<{ email: string; reason: string }> = [];

  async function sendOne(contact: SendableContact) {
    // 1. Insert send record pour récupérer un ID unique de tracking
    const { data: sendRecord, error: insertError } = await supabase
      .from("email_sends")
      .insert({
        campaign_id,
        contact_id: contact.id,
        status: "pending",
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !sendRecord) {
      failures.push({ email: contact.email, reason: insertError?.message || "insert fail" });
      failedCount++;
      return;
    }

    // 2. Tracking (pixel + link rewrite)
    const trackedHtml = applyTracking(campaign.html_content, sendRecord.id);

    // 3. Personnalisation (merge tags)
    const personalizedHtml = trackedHtml
      .replace(/\{\{prenom\}\}/gi, contact.first_name || "")
      .replace(/\{\{email\}\}/gi, contact.email);

    // 4. Envoi SES
    const result = await sendEmail({
      to: contact.email,
      subject: campaign.subject,
      html: personalizedHtml,
    });

    // 5. Update status
    await supabase
      .from("email_sends")
      .update({ status: result.success ? "sent" : "failed" })
      .eq("id", sendRecord.id);

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
      failures.push({
        email: contact.email,
        reason: result.error || "SES send failed",
      });
    }
  }

  // Batching : chunks de BATCH_SIZE en parallèle, séquentiels entre batches
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(sendOne));
  }

  // Update campaign stats UNIQUEMENT si on a effectivement envoyé
  const campaignStatus = sentCount > 0 ? "sent" : failedCount > 0 ? "failed" : "draft";
  await supabase
    .from("email_campaigns")
    .update({
      status: campaignStatus,
      sent_at: sentCount > 0 ? new Date().toISOString() : null,
      sent_count: sentCount,
      target_tags: Array.isArray(target_tags) && target_tags.length > 0 ? target_tags : null,
    })
    .eq("id", campaign_id);

  revalidatePath("/admin/emails");
  revalidatePath(`/admin/emails/${campaign_id}`);
  revalidatePath("/admin/dashboard");

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: contacts.length,
    // Ne retourne que les 20 premières erreurs pour éviter un payload énorme
    failures: failures.slice(0, 20),
  });
}
