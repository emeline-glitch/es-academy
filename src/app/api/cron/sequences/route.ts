import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/ses/client";
import { applyTracking } from "@/lib/email/tracking";

// CRON endpoint — processes pending sequence emails
// Call this every 15 minutes via Vercel Cron or external cron
// GET /api/cron/sequences?key=YOUR_CRON_SECRET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Simple auth for cron (set CRON_SECRET in env)
  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const now = new Date().toISOString();

  // Find enrollments where next_send_at <= now and status = active
  const { data: pendingEnrollments, error } = await supabase
    .from("email_sequence_enrollments")
    .select("*, contact:contacts(id, email, first_name, last_name)")
    .eq("status", "active")
    .lte("next_send_at", now)
    .limit(100);

  if (error || !pendingEnrollments) {
    return NextResponse.json({ error: error?.message || "No data", processed: 0 });
  }

  let sent = 0;
  let failed = 0;
  let completed = 0;

  for (const enrollment of pendingEnrollments) {
    // Get the sequence steps
    const { data: steps } = await supabase
      .from("email_sequence_steps")
      .select("*")
      .eq("sequence_id", enrollment.sequence_id)
      .eq("status", "active")
      .order("step_order", { ascending: true });

    if (!steps || steps.length === 0) continue;

    // Check sequence is still active
    const { data: sequence } = await supabase
      .from("email_sequences")
      .select("status")
      .eq("id", enrollment.sequence_id)
      .single();

    if (!sequence || sequence.status !== "active") continue;

    const currentStep = steps[enrollment.current_step];
    if (!currentStep) {
      // Completed all steps
      await supabase
        .from("email_sequence_enrollments")
        .update({ status: "completed", completed_at: now })
        .eq("id", enrollment.id);
      completed++;
      continue;
    }

    const contact = enrollment.contact;
    if (!contact) continue;

    // Create a campaign-like send record for tracking
    const { data: sendRecord } = await supabase
      .from("email_sends")
      .insert({
        campaign_id: null,
        contact_id: contact.id,
        status: "pending",
        sent_at: now,
      })
      .select("id")
      .single();

    // Apply tracking + personalization
    let html = currentStep.html_content;
    if (sendRecord) {
      html = applyTracking(html, sendRecord.id);
    }
    html = html
      .replace(/\{\{prenom\}\}/gi, contact.first_name || "")
      .replace(/\{\{nom\}\}/gi, contact.last_name || "")
      .replace(/\{\{email\}\}/gi, contact.email);

    // Send email
    const result = await sendEmail({
      to: contact.email,
      subject: currentStep.subject.replace(/\{\{prenom\}\}/gi, contact.first_name || ""),
      html,
    });

    // Update send record
    if (sendRecord) {
      await supabase
        .from("email_sends")
        .update({ status: result.success ? "sent" : "failed" })
        .eq("id", sendRecord.id);
    }

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Move to next step
    const nextStepIndex = enrollment.current_step + 1;
    if (nextStepIndex >= steps.length) {
      // Sequence complete
      await supabase
        .from("email_sequence_enrollments")
        .update({ current_step: nextStepIndex, status: "completed", completed_at: now, next_send_at: null })
        .eq("id", enrollment.id);
      completed++;
    } else {
      // Schedule next step
      const nextStep = steps[nextStepIndex];
      const delayMs = (nextStep.delay_days * 24 * 60 + nextStep.delay_hours * 60) * 60 * 1000;
      const nextSendAt = new Date(Date.now() + delayMs).toISOString();

      await supabase
        .from("email_sequence_enrollments")
        .update({ current_step: nextStepIndex, next_send_at: nextSendAt })
        .eq("id", enrollment.id);
    }
  }

  return NextResponse.json({
    processed: pendingEnrollments.length,
    sent,
    failed,
    completed,
    timestamp: now,
  });
}
