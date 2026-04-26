import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Cron /api/cron/seasonal-toggle (quotidien, 5h UTC) :
 *
 * Active automatiquement les lead_magnets dont la fenetre de disponibilite
 * est ouverte aujourd'hui (today >= available_from AND today <= available_until)
 * et desactive ceux dont la fenetre est passee ou pas encore arrivee.
 *
 * Cas d'usage :
 *   - Cahier vacances : actif juillet-aout
 *   - Calendrier avent : actif 20 nov - 24 dec
 *   - Chasse oeufs : actif semaine de Paques
 *
 * Les lm SANS available_from/until ne sont jamais touches (ils restent
 * dans leur etat manuel : masterclass, quiz, simulateur sont permanents).
 *
 * Idempotent : peut tourner plusieurs fois par jour sans effet de bord.
 */

interface LeadMagnetRow {
  id: string;
  slug: string;
  is_active: boolean;
  available_from: string | null;
  available_until: string | null;
}

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
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: lms, error } = await supabase
    .from("lead_magnets")
    .select("id, slug, is_active, available_from, available_until")
    .not("available_from", "is", null)
    .not("available_until", "is", null);

  if (error) {
    console.error("[seasonal-toggle] select error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats: { activated: string[]; deactivated: string[]; unchanged: string[] } = {
    activated: [],
    deactivated: [],
    unchanged: [],
  };

  for (const lm of (lms || []) as LeadMagnetRow[]) {
    const inWindow = today >= lm.available_from! && today <= lm.available_until!;
    if (inWindow === lm.is_active) {
      stats.unchanged.push(lm.slug);
      continue;
    }
    const { error: updErr } = await supabase
      .from("lead_magnets")
      .update({ is_active: inWindow })
      .eq("id", lm.id);
    if (updErr) {
      console.error(`[seasonal-toggle] update ${lm.slug} failed:`, updErr.message);
      continue;
    }
    if (inWindow) {
      stats.activated.push(lm.slug);
    } else {
      stats.deactivated.push(lm.slug);
    }

    // Trace dans audit_log pour que l'admin sache ce qui s'est passe
    await supabase.from("audit_log").insert({
      action: inWindow ? "lead_magnet_activated_seasonal" : "lead_magnet_deactivated_seasonal",
      entity_type: "lead_magnet",
      entity_id: lm.id,
      after: {
        slug: lm.slug,
        today,
        available_from: lm.available_from,
        available_until: lm.available_until,
      },
    });
  }

  return NextResponse.json({ today, ...stats });
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (expectedSecret && auth.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready" });
}
