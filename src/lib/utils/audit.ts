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

export interface RequestContext {
  ip?: string | null;
  user_agent?: string | null;
}

/**
 * Extrait IP + User-Agent depuis les headers d'une Request.
 * À fusionner ensuite dans le champ `after.request_context` quand on appelle writeAuditLog.
 */
export function extractRequestContext(request: Request): RequestContext {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null;
  const user_agent = headers.get("user-agent")?.slice(0, 500) || null;
  return { ip, user_agent };
}

/**
 * Écrit une entrée dans la table audit_log. Ne throw jamais : si la table
 * n'existe pas encore (migration 005 non appliquée), on log sans planter.
 *
 * Conventions metadata (dans `after`) :
 *   - Pas de PII en clair (pas d'email de contact supprimé, juste son id)
 *   - Garder le nom de la ressource pour traçabilité humaine
 *   - request_context: { ip, user_agent } via extractRequestContext()
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
    console.warn("[audit_log] write failed:", e);
  }
}
