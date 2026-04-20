import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";

/**
 * Bulk ajoute un ou plusieurs tags à une sélection de contacts.
 * Fait le merge côté serveur pour éviter la race condition où le client
 * écrit avec des tags stales.
 *
 * Body : { contact_ids: string[], tags_to_add: string[] }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { contact_ids, tags_to_add } = body as {
    contact_ids?: string[];
    tags_to_add?: string[];
  };

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return NextResponse.json({ error: "contact_ids requis" }, { status: 400 });
  }
  if (!Array.isArray(tags_to_add) || tags_to_add.length === 0) {
    return NextResponse.json({ error: "tags_to_add requis" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 1. Fetch current tags (fresh)
  const { data: contacts, error: fetchErr } = await supabase
    .from("contacts")
    .select("id, tags")
    .in("id", contact_ids);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // 2. Merge avec les nouveaux tags (dedup) et update en parallèle
  const updates = (contacts || []).map((c) => {
    const merged = Array.from(new Set([...(c.tags || []), ...tags_to_add]));
    return supabase.from("contacts").update({ tags: merged }).eq("id", c.id);
  });
  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error).length;

  // Auto-enrollment : pour chaque contact tagué, enroll dans les séquences matching
  // (le tags_to_add peut matcher plusieurs séquences, l'upsert est idempotent)
  let totalEnrolled = 0;
  for (const c of contacts || []) {
    const { enrolled } = await autoEnrollByTags(supabase, c.id, tags_to_add);
    totalEnrolled += enrolled;
  }

  revalidatePath("/admin/contacts");
  revalidatePath("/admin/dashboard");

  return NextResponse.json({
    updated: (contacts?.length || 0) - errors,
    errors,
    auto_enrolled: totalEnrolled,
  });
}
