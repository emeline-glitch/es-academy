import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { gzipSync } from "node:zlib";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Backup DB quotidien (cron 4h UTC = 6h Paris ete).
 *
 * Strategie :
 * 1. Pour chaque table critique : SELECT * en JSON
 * 2. Concat dans un objet { metadata, tables: {table1: [...], ...} }
 * 3. Gzip
 * 4. Upload vers Supabase Storage bucket "backups" prive
 *    Nommage : backup-2026-05-18.json.gz (1 fichier par jour, ecrase si re-run)
 * 5. Cleanup : supprime les fichiers > 30 jours
 *
 * En cas de gros volume (>10MB par table), on streamerait par batch.
 * Pour l'instant les volumes sont OK (16k contacts ~3MB JSON).
 *
 * Tables critiques :
 * - contacts (CRM, 16k+ lignes)
 * - enrollments (achats)
 * - family_subscriptions (abos)
 * - audit_log (preuves CNIL, derniers 90 jours seulement vu le volume)
 * - consent_log (preuves RGPD)
 * - email_sequences + steps + enrollments (sequence state)
 * - contact_lists, email_templates (config)
 * - finance_expenses, finance_targets (compta)
 * - profiles (eleves auth + role)
 * - anomaly_alerts (monitoring)
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.replace(/^Bearer\s+/, "") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const startedAt = Date.now();
  const today = new Date().toISOString().slice(0, 10); // 2026-05-18

  // ------------------------------------------------------------------
  // 1. Dump des tables critiques. Audit_log est filtre a 90j pour
  //    eviter d'exploser le backup (table append-only haute volumetrie).
  // ------------------------------------------------------------------
  const tables: Array<{ name: string; filter?: string }> = [
    { name: "contacts" },
    { name: "enrollments" },
    { name: "family_subscriptions" },
    { name: "profiles" },
    {
      name: "audit_log",
      filter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { name: "consent_log" },
    { name: "email_sequences" },
    { name: "email_sequence_steps" },
    { name: "email_sequence_enrollments" },
    { name: "contact_lists" },
    { name: "email_templates" },
    { name: "finance_expenses" },
    { name: "finance_targets" },
    { name: "anomaly_alerts" },
    { name: "forms" },
    { name: "lead_magnets" },
    { name: "checkout_attempts" },
  ];

  const dump: Record<string, unknown> = {};
  const stats: Record<string, number> = {};
  const errors: Array<{ table: string; error: string }> = [];

  for (const t of tables) {
    try {
      const rows = await dumpTable(supabase, t.name, t.filter);
      dump[t.name] = rows;
      stats[t.name] = rows.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      errors.push({ table: t.name, error: msg });
      console.error(`[backup-db] table ${t.name} failed:`, msg);
    }
  }

  // ------------------------------------------------------------------
  // 2. Serialize + gzip
  // ------------------------------------------------------------------
  const payload = {
    metadata: {
      backup_date: today,
      backup_started_at: new Date(startedAt).toISOString(),
      backup_completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      tables_dumped: Object.keys(dump),
      tables_failed: errors.map((e) => e.table),
      row_counts: stats,
      schema_version: "es-academy-1.0",
    },
    tables: dump,
  };

  const json = JSON.stringify(payload);
  const jsonSize = Buffer.byteLength(json, "utf8");
  const gzipped = gzipSync(json);

  // ------------------------------------------------------------------
  // 3. Upload vers Storage bucket "backups"
  // ------------------------------------------------------------------
  const filename = `backup-${today}.json.gz`;
  const { error: uploadErr } = await supabase.storage
    .from("backups")
    .upload(filename, gzipped, {
      contentType: "application/gzip",
      upsert: true,  // ecrase si re-run le meme jour (idempotent)
    });

  if (uploadErr) {
    console.error("[backup-db] upload failed:", uploadErr);
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // ------------------------------------------------------------------
  // 4. Cleanup : retire les backups > 30 jours
  // ------------------------------------------------------------------
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const { data: files } = await supabase.storage.from("backups").list("", { limit: 100 });
  const toDelete = (files || [])
    .map((f) => f.name)
    .filter((name) => {
      const match = name.match(/backup-(\d{4}-\d{2}-\d{2})\.json\.gz/);
      return match && match[1] < cutoff;
    });
  if (toDelete.length > 0) {
    await supabase.storage.from("backups").remove(toDelete);
  }

  // ------------------------------------------------------------------
  // 5. Audit log : trace le backup
  // ------------------------------------------------------------------
  try {
    await supabase.from("audit_log").insert({
      action: "backup_db",
      entity_type: "system",
      entity_id: null,
      after: {
        filename,
        json_size_bytes: jsonSize,
        gzipped_size_bytes: gzipped.length,
        compression_ratio: Math.round((1 - gzipped.length / jsonSize) * 100),
        row_counts: stats,
        errors: errors.length > 0 ? errors : null,
        deleted_old_backups: toDelete,
        duration_ms: Date.now() - startedAt,
      },
    });
  } catch {
    // Audit log non-critique
  }

  return NextResponse.json({
    ok: errors.length === 0,
    filename,
    json_size_kb: Math.round(jsonSize / 1024),
    gzipped_size_kb: Math.round(gzipped.length / 1024),
    compression_ratio: `${Math.round((1 - gzipped.length / jsonSize) * 100)}%`,
    row_counts: stats,
    errors: errors.length > 0 ? errors : undefined,
    deleted_old_backups: toDelete,
    duration_ms: Date.now() - startedAt,
  });
}

/**
 * Helper SELECT * sur une table, en pageant pour eviter d'exploser la
 * memoire si la table est grosse (>10k rows). Supabase REST a un default
 * limit de 1000 -> on pagine par 1000.
 */
async function dumpTable(
  supabase: SupabaseClient,
  table: string,
  filterCreatedAtGte?: string,
): Promise<unknown[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: unknown[] = [];
  for (;;) {
    let query = supabase.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    if (filterCreatedAtGte) {
      query = query.gte("created_at", filterCreatedAtGte);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}
