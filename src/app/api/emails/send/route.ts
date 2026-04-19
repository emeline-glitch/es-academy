import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import { applyTracking } from "@/lib/email/tracking";

export async function POST(request: Request) {
  // Auth via cookies (createServiceClient bypasse RLS mais n'a plus de cookies)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
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
  let contacts = allContacts;
  if (Array.isArray(target_tags) && target_tags.length > 0) {
    contacts = contacts.filter((c) => {
      const contactTags = (c.tags as string[]) || [];
      return target_tags.some((tag: string) => contactTags.includes(tag));
    });
  }

  let sentCount = 0;
  let failedCount = 0;

  // Send emails one by one (each gets unique tracking IDs)
  for (const contact of contacts) {
    // 1. Create the send record FIRST to get the send ID
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
      failedCount++;
      continue;
    }

    // 2. Apply tracking (pixel + link rewriting) with this send's unique ID
    const trackedHtml = applyTracking(campaign.html_content, sendRecord.id);

    // 3. Personalize (replace {{prenom}} etc.)
    const personalizedHtml = trackedHtml
      .replace(/\{\{prenom\}\}/gi, contact.first_name || "")
      .replace(/\{\{email\}\}/gi, contact.email);

    // 4. Send the email
    const result = await sendEmail({
      to: contact.email,
      subject: campaign.subject,
      html: personalizedHtml,
    });

    // 5. Update send status
    await supabase
      .from("email_sends")
      .update({ status: result.success ? "sent" : "failed" })
      .eq("id", sendRecord.id);

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  // Update campaign stats
  await supabase
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      target_tags: Array.isArray(target_tags) && target_tags.length > 0 ? target_tags : null,
    })
    .eq("id", campaign_id);

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: contacts.length,
  });
}
