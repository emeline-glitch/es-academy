import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET public /api/forms/[slug] — retourne la config d'un formulaire publié.
 * Utilisé par la page publique /form/[slug].
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("forms")
    .select("id, slug, title, description, success_message, background_image_url, require_phone, require_last_name, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Formulaire introuvable" }, { status: 404 });
  return NextResponse.json({ form: data });
}
