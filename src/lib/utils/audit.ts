import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Écrit une entrée dans la table audit_log. Ne throw jamais — si la table
 * n'existe pas encore (migration 005 non appliquée), on log sans planter.
 */
export async function writeAuditLog(supabase: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      actor_id: entry.actor_id || null,
      actor_email: entry.actor_email || null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      before: entry.before || null,
      after: entry.after || null,
    });
  } catch (e) {
    // Ne pas bloquer la mutation métier si l'audit échoue
    console.warn("[audit_log] write failed:", e);
  }
}
