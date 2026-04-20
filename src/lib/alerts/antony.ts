import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/ses/client";

/**
 * Déclenche l'alerte Antony quand un contact passe en lead-warm ou lead-hot.
 *
 * Actions :
 * 1. Envoie un email interne à ANTONY_EMAIL (env) avec le contexte du contact
 * 2. Si SLACK_WEBHOOK_URL est configuré, poste une notif dans le channel
 * 3. Déplace le contact dans le pipeline au stage 'rdv_pris' (lead qualifié)
 * 4. Log un contact_event pour la timeline
 *
 * Idempotent : si le contact a déjà reçu une alerte récente (même action < 24h),
 * on skip pour éviter le spam.
 */
export async function triggerAntonyAlert(
  supabase: SupabaseClient,
  contactId: string,
  level: "warm" | "hot",
  reason: string
): Promise<{ sent: boolean; skipped?: string }> {
  // Anti-spam : check si alerte déjà envoyée dans les 24 dernières heures
  const { data: recent } = await supabase
    .from("contact_events")
    .select("id")
    .eq("contact_id", contactId)
    .eq("event_type", "antony_alert")
    .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .limit(1);

  if (recent && recent.length > 0) {
    return { sent: false, skipped: "alerte déjà envoyée dans les 24h" };
  }

  // Charger le contact + ses events récents pour contexte
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name, phone, tags, pipeline_stage, subscribed_at")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact) {
    return { sent: false, skipped: "contact introuvable" };
  }

  const { data: events } = await supabase
    .from("contact_events")
    .select("event_type, metadata, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(10);

  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email;
  const levelLabel = level === "hot" ? "🔥 HOT (prioritaire)" : "🌡️ WARM";
  const fiche = `https://emeline-siron.fr/admin/contacts/${contactId}`;

  const antonyEmail = process.env.ANTONY_EMAIL || "antony@emeline-siron.fr";

  // 1. Email interne
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Alerte lead ${levelLabel}</p>
<h1 style="color: #1B4332; margin: 10px 0;">${name}</h1>
<p><strong>Email :</strong> ${contact.email}<br>
${contact.phone ? `<strong>Téléphone :</strong> ${contact.phone}<br>` : ""}
<strong>Inscrit depuis :</strong> ${new Date(contact.subscribed_at).toLocaleDateString("fr-FR")}<br>
<strong>Pipeline actuel :</strong> ${contact.pipeline_stage || "leads"}</p>

<p><strong>Raison de l'alerte :</strong><br>${reason}</p>

<p><strong>Tags actuels :</strong><br>
${(contact.tags || []).map((t: string) => `<code style="background: #eee; padding: 2px 6px; border-radius: 3px; margin-right: 4px; display: inline-block; margin-bottom: 4px;">${t}</code>`).join(" ")}
</p>

<h3 style="color: #1B4332; margin-top: 30px;">Activité récente (10 derniers events)</h3>
${events && events.length > 0
    ? `<ul style="font-size: 13px;">${events.map((e) => `<li>${new Date(e.created_at).toLocaleString("fr-FR")} · <strong>${e.event_type}</strong>${e.metadata ? ` · ${JSON.stringify(e.metadata)}` : ""}</li>`).join("")}</ul>`
    : "<p style=\"font-size: 13px; color: #888;\">Pas d'events enregistrés</p>"}

<p style="text-align: center; margin: 30px 0;">
  <a href="${fiche}" style="background: #1B4332; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ouvrir la fiche contact</a>
</p>

<p style="font-size: 11px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
  Alerte générée automatiquement par ES Academy CRM.<br>
  Tu reçois cette notif parce que tu es le closer sur les leads chauds.
</p>
</div>`;

  const emailResult = await sendEmail({
    to: antonyEmail,
    subject: `[Lead ${level.toUpperCase()}] ${name}`,
    html,
    from: "ES Academy CRM <emeline@es-academy.fr>",
    replyTo: contact.email,
  });

  // 2. Slack webhook (optionnel)
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${levelLabel} · ${name} · <${fiche}|Ouvrir la fiche>`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${levelLabel}*\n*${name}* <${fiche}|(voir fiche)>\n\n${reason}`,
              },
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `📧 ${contact.email}${contact.phone ? ` · 📞 ${contact.phone}` : ""}` },
              ],
            },
          ],
        }),
      });
    } catch (e) {
      console.warn("[antony-alert] Slack webhook failed:", e);
    }
  }

  // 3. Déplacer le contact dans le pipeline au stage 'rdv_pris' (lead qualifié)
  // Seulement si le contact n'est pas déjà plus avancé
  const advancedStages = ["rdv_effectif", "offre_envoyee", "gagne"];
  if (!advancedStages.includes(contact.pipeline_stage || "")) {
    await supabase
      .from("contacts")
      .update({
        pipeline_stage: "rdv_pris",
        pipeline_updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);
  }

  // 4. Log l'event pour tracking + anti-spam 24h
  await supabase.from("contact_events").insert({
    contact_id: contactId,
    event_type: "antony_alert",
    metadata: { level, reason, email_sent: emailResult.success, slack_sent: !!slackUrl },
  });

  return { sent: emailResult.success };
}
