import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import { applyTracking } from "@/lib/email/tracking";

export async function POST(request: Request) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { to, subject, html_content } = body;

  if (!to || !subject || !html_content) {
    return NextResponse.json({ error: "to, subject et html_content requis" }, { status: 400 });
  }

  // Create a temporary send record for tracking
  const { data: tempCampaign } = await supabase
    .from("email_campaigns")
    .upsert(
      { subject: `[TEST] ${subject}`, html_content, status: "test", sent_count: 1 },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  // Insert campaign for test
  let campaignId = tempCampaign?.id;
  if (!campaignId) {
    const { data: newCampaign } = await supabase
      .from("email_campaigns")
      .insert({ subject: `[TEST] ${subject}`, html_content, status: "test", sent_count: 1 })
      .select("id")
      .single();
    campaignId = newCampaign?.id;
  }

  // Create a test contact if needed
  const { data: contact } = await supabase
    .from("contacts")
    .upsert(
      { email: to.toLowerCase().trim(), first_name: "Test", last_name: "User", source: "test", tags: ["test"], status: "active" },
      { onConflict: "email" }
    )
    .select("id, first_name")
    .single();

  if (!contact || !campaignId) {
    return NextResponse.json({ error: "Erreur création contact/campagne test" }, { status: 500 });
  }

  // Create send record for tracking
  const { data: sendRecord } = await supabase
    .from("email_sends")
    .insert({
      campaign_id: campaignId,
      contact_id: contact.id,
      status: "pending",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // Apply tracking
  let finalHtml = html_content;
  if (sendRecord) {
    finalHtml = applyTracking(html_content, sendRecord.id);
  }

  // Personalize
  finalHtml = finalHtml
    .replace(/\{\{prenom\}\}/gi, contact.first_name || "Test")
    .replace(/\{\{email\}\}/gi, to);

  // Wrap in email template
  const wrappedHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#2c6e55;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;font-size:20px;margin:0;font-family:Georgia,serif;">Emeline Siron</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          ${finalHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #eee;text-align:center;">
          <p style="font-size:10px;color:#999;margin:0;">
            Emeline Siron &middot; Aix-en-Provence &middot; <a href="#" style="color:#999;">Se désabonner</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  // Send the email
  const result = await sendEmail({
    to,
    subject: `[TEST] ${subject}`,
    html: wrappedHtml,
  });

  // Update send status
  if (sendRecord) {
    await supabase
      .from("email_sends")
      .update({ status: result.success ? "sent" : "failed" })
      .eq("id", sendRecord.id);
  }

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    note: result.success
      ? `Email test envoyé à ${to}. Ouvre-le pour tester le tracking d'ouverture, clique sur un lien pour tester le tracking de clic.`
      : undefined,
  });
}
