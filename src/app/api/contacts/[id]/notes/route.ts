import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const VALID_KINDS = ["note", "rdv", "appel", "email"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
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
  const auth = await requireAdmin();
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
