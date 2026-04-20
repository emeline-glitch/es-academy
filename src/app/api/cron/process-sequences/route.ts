import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";
import { applyTracking } from "@/lib/email/tracking";

/**
 * Cron /api/cron/process-sequences :
 * À appeler toutes les 5-15 min (pg_cron via pg_net, Netlify scheduled function, ou cron externe).
 *
 * Pour chaque enrollment actif dont next_send_at <= now :
 * 1. Récupère le next_step (step_order > current_step)
 * 2. Render le mail avec les variables {{prenom}}, {{email}}, etc.
 * 3. Envoie via SES avec tracking (pixel + link rewrite)
 * 4. Crée un email_sends record pour le tracking
 * 5. Update enrollment : current_step = next_step.step_order, next_send_at = now + delay du step suivant
 * 6. Si c'est le dernier step : mark completed + auto-tag 'completed_welcome' si c'est une séquence welcome
 *
 * Sécurité : header Authorization: Bearer <CRON_SECRET>
 */

const BATCH_SIZE = 50;

interface PendingSend {
  enrollment_id: string;
  sequence_id: string;
  sequence_name: string;
  contact_id: string;
  contact_email: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  current_step: number;
  next_step_id: string;
  next_step_order: number;
  next_step_subject: string;
  next_step_html: string;
  next_step_delay_days: number;
  next_step_delay_hours: number;
  is_last_step: boolean;
}

function renderMergeTags(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, name) => vars[name] ?? "");
}

// Détecte si une séquence est une "welcome" (son trigger_value commence par 'lm:' ou est 'source:alumni-evermind'…)
// Quand elle se termine, on ajoute le tag 'completed_welcome' au contact pour enrôler dans SEQ_NM
function isWelcomeSequence(seqName: string): boolean {
  const lower = seqName.toLowerCase();
  return (
    lower.includes("welcome") ||
    lower.includes("alumni evermind") ||
    lower.includes("seq_mc") ||
    lower.includes("seq_sim") ||
    lower.includes("seq_qz") ||
    lower.includes("seq_al")
  );
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré côté serveur" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (provided !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const { data: pending, error } = await supabase.rpc("get_pending_sequence_sends", {
    batch_size: BATCH_SIZE,
  });

  if (error) {
    console.error("[cron/process-sequences] RPC error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (pending || []) as PendingSend[];
  if (items.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0, completed: 0 });
  }

  let sent = 0;
  let failed = 0;
  let completed = 0;
  const errors: Array<{ email: string; reason: string }> = [];

  // Traite les envois en parallèle par batch de 10 pour respecter les quotas SES
  const CHUNK = 10;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map(async (item) => {
        const vars = {
          prenom: item.contact_first_name || "",
          nom: item.contact_last_name || "",
          email: item.contact_email,
          unsubscribe_url: `https://emeline-siron.fr/desabonnement?email=${encodeURIComponent(item.contact_email)}`,
        };

        // 1. Créer l'email_send record pour le tracking ID
        const { data: sendRecord, error: insErr } = await supabase
          .from("email_sends")
          .insert({
            campaign_id: null,
            contact_id: item.contact_id,
            status: "pending",
            sent_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insErr || !sendRecord) {
          failed++;
          errors.push({ email: item.contact_email, reason: insErr?.message || "insert send record failed" });
          return;
        }

        // 2. Render + tracking
        const subject = renderMergeTags(item.next_step_subject, vars);
        const htmlBase = renderMergeTags(item.next_step_html, vars);
        const html = applyTracking(htmlBase, sendRecord.id);

        // 3. Send via SES
        const result = await sendEmail({
          to: item.contact_email,
          subject,
          html,
        });

        // 4. Update send status
        await supabase
          .from("email_sends")
          .update({ status: result.success ? "sent" : "failed" })
          .eq("id", sendRecord.id);

        if (!result.success) {
          failed++;
          errors.push({ email: item.contact_email, reason: result.error || "SES fail" });
          return;
        }
        sent++;

        // 5. Avance l'enrollment
        if (item.is_last_step) {
          // Dernier step, on marque l'enrollment completed
          await supabase
            .from("email_sequence_enrollments")
            .update({
              current_step: item.next_step_order,
              last_sent_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              status: "completed",
            })
            .eq("id", item.enrollment_id);
          completed++;

          // 6. Si c'est une séquence welcome, auto-tag le contact avec 'completed_welcome'
          // → ça trigger SEQ_NM (nurture maître) via l'auto-enrollment engine
          if (isWelcomeSequence(item.sequence_name)) {
            const { data: contact } = await supabase
              .from("contacts")
              .select("tags")
              .eq("id", item.contact_id)
              .maybeSingle();
            const tags = contact?.tags || [];
            if (!tags.includes("completed_welcome")) {
              await supabase
                .from("contacts")
                .update({ tags: [...tags, "completed_welcome"] })
                .eq("id", item.contact_id);

              // Auto-enroll dans SEQ_NM (trigger tag_added / completed_welcome)
              const { data: nurtureSeq } = await supabase
                .from("email_sequences")
                .select("id")
                .eq("status", "active")
                .eq("trigger_type", "tag_added")
                .eq("trigger_value", "completed_welcome")
                .maybeSingle();
              if (nurtureSeq) {
                await supabase
                  .from("email_sequence_enrollments")
                  .upsert(
                    {
                      sequence_id: nurtureSeq.id,
                      contact_id: item.contact_id,
                      status: "active",
                      current_step: 0,
                      enrolled_at: new Date().toISOString(),
                      next_send_at: new Date().toISOString(),
                    },
                    { onConflict: "sequence_id,contact_id", ignoreDuplicates: true }
                  );
              }
            }
          }
        } else {
          // Il y a un step suivant, on calcule son delay
          // Note : le delay_days/hours du NEXT step détermine quand ENVOYER ce step.
          // Donc ici on envoie le step courant (next_step_order), et on cherche le step suivant pour le delay.
          const { data: followingStep } = await supabase
            .from("email_sequence_steps")
            .select("delay_days, delay_hours")
            .eq("sequence_id", item.sequence_id)
            .gt("step_order", item.next_step_order)
            .order("step_order", { ascending: true })
            .limit(1)
            .maybeSingle();

          const delayDays = followingStep?.delay_days ?? 1;
          const delayHours = followingStep?.delay_hours ?? 0;
          const nextSendAt = new Date(
            Date.now() + delayDays * 24 * 3600 * 1000 + delayHours * 3600 * 1000
          );

          await supabase
            .from("email_sequence_enrollments")
            .update({
              current_step: item.next_step_order,
              last_sent_at: new Date().toISOString(),
              next_send_at: nextSendAt.toISOString(),
            })
            .eq("id", item.enrollment_id);
        }
      })
    );
  }

  return NextResponse.json({
    processed: items.length,
    sent,
    failed,
    completed,
    errors: errors.slice(0, 20),
  });
}

// GET pour healthcheck cron
export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (expectedSecret && provided !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready", batch_size: BATCH_SIZE });
}
