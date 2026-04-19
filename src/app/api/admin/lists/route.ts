import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Non authentifié" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false as const, status: 403 as const, error: "Accès réservé aux admins" };
  return { ok: true as const };
}

/**
 * GET → retourne folders + lists + count par liste (via query sur tags)
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();

  const [foldersRes, listsRes, contactsRes] = await Promise.all([
    supabase.from("contact_list_folders").select("*").order("sort_order", { ascending: true }),
    supabase.from("contact_lists").select("*").order("sort_order", { ascending: true }),
    supabase.from("contacts").select("tags").eq("status", "active"),
  ]);

  if (foldersRes.error) return NextResponse.json({ error: foldersRes.error.message }, { status: 500 });
  if (listsRes.error) return NextResponse.json({ error: listsRes.error.message }, { status: 500 });

  // Compter les contacts par tag_key
  const counts: Record<string, number> = {};
  for (const c of contactsRes.data || []) {
    for (const tag of c.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  const listsWithCount = (listsRes.data || []).map((l) => ({
    ...l,
    contact_count: counts[l.tag_key] || 0,
  }));

  return NextResponse.json({
    folders: foldersRes.data || [],
    lists: listsWithCount,
  });
}

/**
 * POST → crée une liste ou un dossier selon payload
 * body : { kind: "folder" | "list", name, tag_key?, folder_id?, description?, color? }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();
  const body = await request.json().catch(() => ({}));
  const { kind, name } = body as { kind?: string; name?: string };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  if (kind === "folder") {
    const { data, error } = await supabase
      .from("contact_list_folders")
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ folder: data });
  }

  if (kind === "list") {
    const { tag_key, folder_id, description, color } = body as {
      tag_key?: string;
      folder_id?: string;
      description?: string;
      color?: string;
    };
    const key = (tag_key || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const { data, error } = await supabase
      .from("contact_lists")
      .insert({
        name: name.trim(),
        tag_key: key,
        folder_id: folder_id || null,
        description: description || null,
        color: color || "gray",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ list: data });
  }

  return NextResponse.json({ error: "kind invalide (folder | list)" }, { status: 400 });
}

/**
 * DELETE → supprime une liste ou un dossier selon query params
 * ?kind=folder&id=xxx  ou  ?kind=list&id=xxx
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!id || (kind !== "folder" && kind !== "list")) {
    return NextResponse.json({ error: "kind et id requis" }, { status: 400 });
  }

  const table = kind === "folder" ? "contact_list_folders" : "contact_lists";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
