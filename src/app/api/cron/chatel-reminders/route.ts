import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";

/**
 * Cron /api/cron/chatel-reminders :
 * À appeler 1x par jour (8h du matin).
 *
 * Pour les billing_reminders actives (pas cancelled, pas activated) :
 * - trial_end = today + 15 et reminder_j15_sent_at null → envoie template chatel_j15
 * - trial_end = today + 7  et reminder_j7_sent_at null  → envoie template chatel_j7
 *
 * L'activation effective (bascule Stripe trial_end → paid) est gérée séparément par Stripe.
 *
 * Sécurité : header Authorization: Bearer <CRON_SECRET>
 */

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateISO = (offsetDays: number): string => {
    const d = new Date(today.getTime() + offsetDays * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const stats = { j15_sent: 0, j15_failed: 0, j7_sent: 0, j7_failed: 0 };

  // ────────────────────────────────────────────────────────────────────
  // J-15
  // ────────────────────────────────────────────────────────────────────
  const { data: j15List } = await supabase
    .from("billing_reminders")
    .select("id, contact_id, product, trial_end, monthly_price_cents, created_at, stripe_subscription_id")
    .eq("trial_end", dateISO(15))
    .is("reminder_j15_sent_at", null)
    .is("cancelled_at", null)
    .is("activation_confirmed_at", null);

  for (const r of j15List || []) {
    const sent = await sendChatelReminder(supabase, r, "chatel_j15");
    if (sent) {
      await supabase
        .from("billing_reminders")
        .update({ reminder_j15_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      stats.j15_sent++;
    } else {
      stats.j15_failed++;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // J-7
  // ────────────────────────────────────────────────────────────────────
  const { data: j7List } = await supabase
    .from("billing_reminders")
    .select("id, contact_id, product, trial_end, monthly_price_cents, created_at, stripe_subscription_id")
    .eq("trial_end", dateISO(7))
    .is("reminder_j7_sent_at", null)
    .is("cancelled_at", null)
    .is("activation_confirmed_at", null);

  for (const r of j7List || []) {
    const sent = await sendChatelReminder(supabase, r, "chatel_j7");
    if (sent) {
      await supabase
        .from("billing_reminders")
        .update({ reminder_j7_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      stats.j7_sent++;
    } else {
      stats.j7_failed++;
    }
  }

  return NextResponse.json(stats);
}

interface BillingReminderRow {
  id: string;
  contact_id: string;
  product: string;
  trial_end: string;
  monthly_price_cents: number;
  created_at: string;
  stripe_subscription_id: string | null;
}

async function sendChatelReminder(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  reminder: BillingReminderRow,
  templateKey: "chatel_j15" | "chatel_j7"
): Promise<boolean> {
  const { data: contact } = await supabase
    .from("contacts")
    .select("email, first_name, last_name")
    .eq("id", reminder.contact_id)
    .maybeSingle();
  if (!contact?.email) return false;

  const monthlyPrice = ((reminder.monthly_price_cents || 0) / 100).toFixed(0);
  const trialEnd = new Date(reminder.trial_end).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const enrollDate = new Date(reminder.created_at).toLocaleDateString("fr-FR");
  const cancelToken = Buffer.from(`${reminder.id}:${reminder.contact_id}`).toString("base64url");

  const rendered = await renderEmailTemplate(templateKey, {
    prenom: contact.first_name || "",
    email: contact.email,
    family_trial_end: trialEnd,
    monthly_price: monthlyPrice,
    enroll_date: enrollDate,
    cancel_token: cancelToken,
  });

  if (!rendered) {
    console.warn(`[chatel-reminders] template ${templateKey} introuvable`);
    return false;
  }

  const res = await sendEmail({
    to: contact.email,
    subject: rendered.subject,
    html: rendered.html,
    from: `${rendered.from_name} <${rendered.from_email}>`,
    replyTo: rendered.reply_to || undefined,
  });

  return res.success;
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (expectedSecret && auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready" });
}
