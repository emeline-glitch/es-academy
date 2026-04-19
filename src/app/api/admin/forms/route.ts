import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("forms")
    .select("*, list:list_id (id, name, tag_key)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ forms: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { name, title, description, list_id, slug } = body as {
    name?: string;
    title?: string;
    description?: string;
    list_id?: string;
    slug?: string;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  let finalSlug = (slug ? slugify(slug) : slugify(name)) || `form-${Date.now()}`;

  // Check proactif : si le slug existe déjà, on suffixe -2, -3 … pour éviter le 409
  const { data: existingSlugs } = await supabase
    .from("forms")
    .select("slug")
    .ilike("slug", `${finalSlug}%`);
  const takenSlugs = new Set((existingSlugs || []).map((f) => f.slug));
  if (takenSlugs.has(finalSlug)) {
    let i = 2;
    while (takenSlugs.has(`${finalSlug}-${i}`)) i++;
    finalSlug = `${finalSlug}-${i}`;
  }

  const { data, error } = await supabase
    .from("forms")
    .insert({
      name: name.trim(),
      title: title?.trim() || name.trim(),
      description: description?.trim() || "",
      list_id: list_id || null,
      slug: finalSlug,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce slug est déjà utilisé, choisis-en un autre" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/admin/forms");
  return NextResponse.json({ form: data });
}
