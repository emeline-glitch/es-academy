import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const VALID_FORMATS = ["masterclass", "quiz", "simulator", "pdf", "email_series", "game"] as const;

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
    .from("lead_magnets")
    .select("*, welcome_sequence:welcome_sequence_id (id, name, status)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats perf sur 30j
  const { data: perfData } = await supabase.rpc("lead_magnets_performance", { period_days: 30 });
  const perfMap = new Map<string, { opt_ins: number; conversions_to_academy: number; conversion_rate: number }>();
  for (const row of (perfData || []) as Array<{ lead_magnet_slug: string; opt_ins: number; conversions_to_academy: number; conversion_rate: number }>) {
    perfMap.set(row.lead_magnet_slug, {
      opt_ins: Number(row.opt_ins) || 0,
      conversions_to_academy: Number(row.conversions_to_academy) || 0,
      conversion_rate: Number(row.conversion_rate) || 0,
    });
  }

  const enriched = (data || []).map((lm) => ({
    ...lm,
    stats_30d: perfMap.get(lm.slug) || { opt_ins: 0, conversions_to_academy: 0, conversion_rate: 0 },
  }));

  return NextResponse.json({ lead_magnets: enriched });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const { name, format, description, slug, opt_in_tag } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  if (!format || !VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `Format invalide (attendu: ${VALID_FORMATS.join(", ")})` },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();
  let finalSlug = slug ? slugify(slug) : slugify(name);
  if (!finalSlug) finalSlug = `lm-${Date.now()}`;

  const { data: existing } = await supabase.from("lead_magnets").select("slug").ilike("slug", `${finalSlug}%`);
  const taken = new Set((existing || []).map((l) => l.slug));
  if (taken.has(finalSlug)) {
    let i = 2;
    while (taken.has(`${finalSlug}-${i}`)) i++;
    finalSlug = `${finalSlug}-${i}`;
  }

  const finalTag = opt_in_tag || `lm:${finalSlug}`;

  const { data, error } = await supabase
    .from("lead_magnets")
    .insert({
      name: name.trim(),
      slug: finalSlug,
      format,
      description: description || null,
      opt_in_tag: finalTag,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/admin/lead-magnets");
  return NextResponse.json({ lead_magnet: data });
}
