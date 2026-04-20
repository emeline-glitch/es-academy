import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Moteur d'auto-enrollment : quand un tag est ajouté à un contact, vérifie s'il existe
 * une séquence active avec trigger_type='tag_added' et trigger_value matching, et enrôle
 * le contact dedans (idempotent : UNIQUE sur sequence_id,contact_id).
 *
 * À appeler depuis :
 * - /api/contacts/[id] PATCH (tags modifiés)
 * - /api/admin/contacts/bulk-add-tags (bulk tag)
 * - /api/admin/import-contacts (après upsert)
 * - /api/forms/[slug]/submit (après tagging public)
 * - /api/contacts/[id]/promote (après achat)
 */
export async function autoEnrollByTags(
  supabase: SupabaseClient,
  contactId: string,
  newlyAddedTags: string[]
): Promise<{ enrolled: number; skipped: number; errors: number }> {
  if (!contactId || newlyAddedTags.length === 0) {
    return { enrolled: 0, skipped: 0, errors: 0 };
  }

  // Charge les séquences actives avec trigger_type=tag_added dont le trigger_value matche un tag ajouté
  const { data: sequences, error: seqErr } = await supabase
    .from("email_sequences")
    .select("id, name, trigger_value")
    .eq("status", "active")
    .eq("trigger_type", "tag_added")
    .in("trigger_value", newlyAddedTags);

  if (seqErr || !sequences || sequences.length === 0) {
    return { enrolled: 0, skipped: 0, errors: seqErr ? 1 : 0 };
  }

  let enrolled = 0;
  let skipped = 0;
  let errors = 0;

  // Pour chaque séquence matching, upsert une enrollment
  // (UNIQUE(sequence_id, contact_id) garantit l'idempotence : pas de double enroll)
  for (const seq of sequences) {
    const { error: enrollErr } = await supabase
      .from("email_sequence_enrollments")
      .upsert(
        {
          sequence_id: seq.id,
          contact_id: contactId,
          status: "active",
          current_step: 0,
          enrolled_at: new Date().toISOString(),
          next_send_at: new Date().toISOString(),
        },
        { onConflict: "sequence_id,contact_id", ignoreDuplicates: true }
      );
    if (enrollErr) {
      if (enrollErr.code === "23505") {
        skipped++;
      } else {
        errors++;
        console.error(`[auto-enroll] seq=${seq.id} contact=${contactId}:`, enrollErr.message);
      }
    } else {
      enrolled++;
    }
  }

  return { enrolled, skipped, errors };
}

/**
 * Détermine les tags réellement ajoutés (pas déjà présents) entre l'ancien et le nouveau tableau.
 * Utile pour n'auto-enroll que sur les NOUVEAUX tags (pas sur ceux qu'on a juste relu).
 */
export function tagsAdded(oldTags: string[] | null | undefined, newTags: string[]): string[] {
  const oldSet = new Set(oldTags || []);
  return newTags.filter((t) => !oldSet.has(t));
}
