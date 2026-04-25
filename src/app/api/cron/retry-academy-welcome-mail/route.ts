import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendAcademyWelcomeEmail } from "@/lib/email/welcome-academy";

/**
 * Cron /api/cron/retry-academy-welcome-mail :
 * À appeler toutes les 10 min (job pg_cron 'es-academy-retry-welcome-mail').
 *
 * Sélectionne les enrollments dont le mail de bienvenue Academy n'a jamais été envoyé
 * malgré la génération du code Family (SES a fail au moment du webhook : sandbox, DKIM,
 * rate limit). Réessaye jusqu'à 3 fois, puis donne up et insert un audit_log
 * 'academy_welcome_email_failed_giveup' visible sur le dashboard admin.
 *
 * Le filtre "généré il y a > 5 min" évite de doubler avec le webhook initial encore en vol.
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

  const { data: pending, error: pendingErr } = await supabase.rpc(
    "academy_welcome_email_pending",
    { p_limit: 50 }
  );
  if (pendingErr) {
    console.error("[retry-welcome-mail] RPC pending failed:", pendingErr.message);
    return NextResponse.json({ error: pendingErr.message }, { status: 500 });
  }

  const stats = { picked: pending?.length || 0, sent: 0, failed: 0, gave_up: 0 };

  for (const row of pending || []) {
    const firstName = (row.full_name || "").split(" ")[0] || "";
    try {
      const res = await sendAcademyWelcomeEmail({
        supabase,
        enrollmentId: row.enrollment_id,
        to: row.email,
        firstName,
        giftCode: row.family_gift_code,
        installments: row.installments || 1,
      });
      if (res.success) {
        stats.sent++;
      } else {
        stats.failed++;
        if ((row.attempts || 0) + 1 >= 3) stats.gave_up++;
      }
    } catch (err) {
      // Un row qui throw ne doit jamais bloquer le batch : on log et on passe au suivant.
      console.error(
        `[retry-welcome-mail] enrollment=${row.enrollment_id} threw:`,
        err instanceof Error ? err.message : err
      );
      stats.failed++;
    }
  }

  return NextResponse.json(stats);
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (expectedSecret && auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready" });
}
