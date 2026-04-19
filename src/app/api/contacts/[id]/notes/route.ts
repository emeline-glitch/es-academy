import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const VALID_KINDS = ["note", "rdv", "appel", "email"] as const;

async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Non authentifié" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false as const, status: 403 as const, error: "Accès réservé aux admins" };
  return { ok: true as const, userId: user.id };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contact_notes")
    .select("id, content, kind, created_at, author_id")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { content, kind } = body as { content?: string; kind?: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }
  const safeKind = kind && VALID_KINDS.includes(kind as typeof VALID_KINDS[number]) ? kind : "note";

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("contact_notes")
    .insert({
      contact_id: id,
      author_id: auth.userId,
      content: content.trim(),
      kind: safeKind,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}
