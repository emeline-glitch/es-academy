import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";

/**
 * Cron /api/cron/detect-behavioral-triggers :
 * À appeler toutes les 1-4 heures.
 *
 * Analyse les contacts + email_sends pour détecter automatiquement :
 * - behavior:multi-magnet : contact avec 2+ tags lm:* dans les 14 derniers jours
 * - behavior:inactive-90 : last_activity_at < now - 90j
 * - behavior:clicked-formation : email_sends.clicked_links contient /academy
 *
 * Pour chaque tag détecté, on ajoute au contact (préservant les autres tags)
 * et l'auto-enrollment engine enrôle dans la séquence comportementale correspondante.
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
  const now = Date.now();

  const stats = {
    multi_magnet_detected: 0,
    inactive_90_detected: 0,
    clicked_formation_detected: 0,
    enrollments_triggered: 0,
  };

  // ────────────────────────────────────────────────────────────────────
  // 1. Multi lead-magnet : contacts avec 2+ tags lm:* qui n'ont pas encore behavior:multi-magnet
  // ────────────────────────────────────────────────────────────────────
  const { data: candidatesMulti } = await supabase
    .from("contacts")
    .select("id, tags, subscribed_at")
    .eq("status", "active")
    .gte("subscribed_at", new Date(now - 14 * 24 * 3600 * 1000).toISOString())
    .limit(500);

  for (const c of candidatesMulti || []) {
    const tags = c.tags || [];
    if (tags.includes("behavior:multi-magnet")) continue;
    const lmCount = tags.filter((t: string) => t.startsWith("lm:")).length;
    if (lmCount < 2) continue;

    const newTags = [...tags, "behavior:multi-magnet"];
    const { error } = await supabase.from("contacts").update({ tags: newTags }).eq("id", c.id);
    if (!error) {
      stats.multi_magnet_detected++;
      const { enrolled } = await autoEnrollByTags(supabase, c.id, ["behavior:multi-magnet"]);
      stats.enrollments_triggered += enrolled;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 2. Inactive 90 jours : contacts dont last_activity_at < now - 90j qui n'ont pas encore behavior:inactive-90
  // ────────────────────────────────────────────────────────────────────
  const inactiveThreshold = new Date(now - 90 * 24 * 3600 * 1000).toISOString();
  const { data: candidatesInactive } = await supabase
    .from("contacts")
    .select("id, tags")
    .eq("status", "active")
    .lt("last_activity_at", inactiveThreshold)
    .limit(500);

  for (const c of candidatesInactive || []) {
    const tags = c.tags || [];
    if (tags.includes("behavior:inactive-90")) continue;

    const newTags = [...tags, "behavior:inactive-90"];
    const { error } = await supabase.from("contacts").update({ tags: newTags }).eq("id", c.id);
    if (!error) {
      stats.inactive_90_detected++;
      const { enrolled } = await autoEnrollByTags(supabase, c.id, ["behavior:inactive-90"]);
      stats.enrollments_triggered += enrolled;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 3. Clicked-formation : contacts ayant cliqué un lien /academy dans email_sends récents
  // ────────────────────────────────────────────────────────────────────
  const recentThreshold = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const { data: recentSends } = await supabase
    .from("email_sends")
    .select("contact_id, clicked_links")
    .gte("sent_at", recentThreshold)
    .not("clicked_links", "is", null);

  const contactsWithAcademyClick = new Set<string>();
  for (const send of recentSends || []) {
    const links = (send.clicked_links as string[] | null) || [];
    if (links.some((l) => l.includes("/academy"))) {
      contactsWithAcademyClick.add(send.contact_id);
    }
  }

  if (contactsWithAcademyClick.size > 0) {
    const ids = Array.from(contactsWithAcademyClick);
    const { data: currentContacts } = await supabase
      .from("contacts")
      .select("id, tags")
      .in("id", ids);

    for (const c of currentContacts || []) {
      const tags = c.tags || [];
      if (tags.includes("behavior:clicked-formation")) continue;

      const newTags = [...tags, "behavior:clicked-formation", "commercial:lead-warm"];
      const { error } = await supabase.from("contacts").update({ tags: newTags }).eq("id", c.id);
      if (!error) {
        stats.clicked_formation_detected++;
        const { enrolled } = await autoEnrollByTags(supabase, c.id, ["behavior:clicked-formation", "commercial:lead-warm"]);
        stats.enrollments_triggered += enrolled;
      }
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
