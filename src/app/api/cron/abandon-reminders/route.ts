import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";

/**
 * Cron /api/cron/abandon-reminders (quotidien 10h UTC) :
 *
 * Pour chaque checkout_attempts en status="pending" depuis >24h :
 *   - Si reminder_j1_sent_at IS NULL et created_at entre 24-48h ago -> envoie J+1
 *   - Si reminder_j3_sent_at IS NULL et j1 envoye et created entre 72-96h -> envoie J+3
 *   - Si reminder_j7_sent_at IS NULL et j3 envoye et created entre 168-192h -> envoie J+7
 *
 * Si l'attempt n'a pas d'email (cas Academy POST sans customer_email),
 * on retrieve la Stripe Checkout Session pour le recuperer dans
 * customer_details. Si toujours absent, on skip cet attempt (Stripe ne
 * peut pas relancer sans email).
 *
 * Idempotent : reminder_jX_sent_at est settee a chaque envoi reussi.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configure" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();

  // Fenetres temporelles : J+1 (24-48h), J+3 (72-96h), J+7 (168-192h).
  // 24h de fenetre evite double envoi si le cron rate un run.
  const stages = [
    {
      level: "j1" as const,
      from: new Date(now.getTime() - 48 * 3600 * 1000),
      to: new Date(now.getTime() - 24 * 3600 * 1000),
      template: "abandon_checkout_j1",
      sentColumn: "reminder_j1_sent_at",
      prerequisite: null as string | null,
    },
    {
      level: "j3" as const,
      from: new Date(now.getTime() - 96 * 3600 * 1000),
      to: new Date(now.getTime() - 72 * 3600 * 1000),
      template: "abandon_checkout_j3",
      sentColumn: "reminder_j3_sent_at",
      prerequisite: "reminder_j1_sent_at",
    },
    {
      level: "j7" as const,
      from: new Date(now.getTime() - 192 * 3600 * 1000),
      to: new Date(now.getTime() - 168 * 3600 * 1000),
      template: "abandon_checkout_j7",
      sentColumn: "reminder_j7_sent_at",
      prerequisite: "reminder_j3_sent_at",
    },
  ];

  const stats = { processed: 0, sent: 0, skipped_no_email: 0, errors: 0 };

  for (const stage of stages) {
    const query = supabase
      .from("checkout_attempts")
      .select("id, stripe_session_id, product, plan, email, created_at, reminder_attempts")
      .eq("status", "pending")
      .gte("created_at", stage.from.toISOString())
      .lte("created_at", stage.to.toISOString())
      .is(stage.sentColumn, null);

    if (stage.prerequisite) {
      query.not(stage.prerequisite, "is", null);
    }

    const { data: candidates, error: fetchErr } = await query.limit(100);
    if (fetchErr) {
      console.error(`[abandon-reminders] fetch ${stage.level} error:`, fetchErr.message);
      continue;
    }

    for (const att of candidates || []) {
      stats.processed++;

      let email = att.email as string | null;

      // Si email manquant, retrieve la session Stripe (customer peut avoir
      // saisi son email dans le formulaire Stripe avant d'abandonner)
      if (!email && att.stripe_session_id) {
        try {
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.retrieve(att.stripe_session_id);
          email = session.customer_details?.email || session.customer_email || null;
          if (email) {
            email = email.toLowerCase();
            await supabase.from("checkout_attempts").update({ email }).eq("id", att.id);
          }
        } catch (err) {
          console.error(`[abandon-reminders] Stripe retrieve ${att.stripe_session_id}:`, err);
        }
      }

      if (!email) {
        stats.skipped_no_email++;
        continue;
      }

      // Recovery URL : redirige vers la landing avec UTM pour tracking.
      // En J+1 la session Stripe peut encore etre vivante (24h limit),
      // en J+3/J+7 elle est expiree donc on renvoie sur la landing.
      const recoveryUrl = att.product === "family"
        ? `${SITE_URL}/family?utm_source=abandon-recovery&utm_medium=email&utm_campaign=${stage.level}&plan=${att.plan || "fondateur"}`
        : `${SITE_URL}/academy?utm_source=abandon-recovery&utm_medium=email&utm_campaign=${stage.level}&plan=${att.plan || "1x"}`;

      // Prenom : on n'a pas le firstName sur checkout_attempts (Stripe le
      // donne en customer_details.name, qu'on lookup si besoin). Pour
      // simplifier en attendant : si on a recup email mais pas name, on
      // tente de retrouver le contact dans le CRM.
      let prenom = "";
      const { data: contact } = await supabase
        .from("contacts")
        .select("first_name")
        .eq("email", email)
        .maybeSingle();
      prenom = contact?.first_name || "";

      const productLabel = att.product === "family" ? "ES Family" : "ES Academy";

      try {
        const rendered = await renderEmailTemplate(stage.template, {
          prenom,
          product: productLabel,
          plan: att.plan || "",
          recovery_url: recoveryUrl,
        });
        if (!rendered) {
          console.error(`[abandon-reminders] template ${stage.template} not found`);
          stats.errors++;
          continue;
        }
        const res = await sendEmail({
          to: email,
          subject: rendered.subject,
          html: rendered.html,
          from: `${rendered.from_name} <${rendered.from_email}>`,
          replyTo: rendered.reply_to || undefined,
        });
        if (!res.success) {
          stats.errors++;
          await supabase
            .from("checkout_attempts")
            .update({
              reminder_attempts: (att.reminder_attempts || 0) + 1,
              reminder_last_error: res.error?.slice(0, 500) || "unknown",
            })
            .eq("id", att.id);
          continue;
        }
        await supabase
          .from("checkout_attempts")
          .update({ [stage.sentColumn]: new Date().toISOString() })
          .eq("id", att.id);
        stats.sent++;
      } catch (err) {
        stats.errors++;
        const msg = err instanceof Error ? err.message : "unknown";
        console.error(`[abandon-reminders] send ${att.id}:`, msg);
        await supabase
          .from("checkout_attempts")
          .update({ reminder_last_error: msg.slice(0, 500) })
          .eq("id", att.id);
      }
    }
  }

  return NextResponse.json({ ok: true, ...stats });
}
