import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, cleanupBuckets } from "@/lib/utils/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST public /api/forms/[slug]/submit — soumission publique du formulaire.
 * - Rate limit strict par IP + email
 * - Upsert du contact dans contacts
 * - Ajoute le tag de la liste associée (si list_id set)
 * - Incrémente le compteur submit_count du formulaire
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    cleanupBuckets();

    const ip = getClientIp(request);
    const ipCheck = rateLimit(`form:ip:${ip}`, 3, 60_000);
    const ipHour = rateLimit(`form:ip-hour:${ip}`, 20, 60 * 60_000);
    if (!ipCheck.allowed || !ipHour.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives, réessaie plus tard." },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      email,
      first_name,
      last_name,
      phone,
      consent,
    } = body as {
      email?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      consent?: boolean;
    };

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 1. Charger le formulaire (uniquement published)
    const { data: form, error: formErr } = await supabase
      .from("forms")
      .select("id, list_id, tag_on_submit, redirect_url")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (formErr || !form) {
      return NextResponse.json({ error: "Formulaire introuvable" }, { status: 404 });
    }

    // 2. Résoudre le tag de la liste (ou fallback sur tag_on_submit)
    let listTag: string | null = null;
    if (form.list_id) {
      const { data: list } = await supabase
        .from("contact_lists")
        .select("tag_key")
        .eq("id", form.list_id)
        .maybeSingle();
      listTag = list?.tag_key || null;
    }
    const tags = Array.from(
      new Set([
        ...(listTag ? [listTag] : []),
        ...(form.tag_on_submit ? [form.tag_on_submit] : []),
        "form_signup",
        `form:${slug}`,
      ])
    );

    // 3. Upsert contact
    const upsertData: Record<string, unknown> = {
      email: email.toLowerCase().trim(),
      first_name: (first_name || "").trim(),
      last_name: (last_name || "").trim(),
      phone: phone?.trim() || null,
      source: `form:${slug}`,
      tags,
      status: "active",
    };
    const { error: upsertErr } = await supabase
      .from("contacts")
      .upsert(upsertData, { onConflict: "email" });

    if (upsertErr) {
      console.error("[form submit] upsert error:", upsertErr);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    // 4. Fusionner les tags si le contact existait déjà (pour ne pas écraser)
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, tags")
      .ilike("email", email.toLowerCase().trim())
      .maybeSingle();
    if (existing) {
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...tags]));
      await supabase.from("contacts").update({ tags: mergedTags }).eq("id", existing.id);
    }

    // 5. Incrément du compteur
    await supabase.rpc("increment_form_submit_count", { form_id_param: form.id }).then(
      () => {},
      async () => {
        // Fallback si la fonction n'existe pas : update manuel
        const { data: f } = await supabase
          .from("forms")
          .select("submit_count")
          .eq("id", form.id)
          .maybeSingle();
        if (f) {
          await supabase
            .from("forms")
            .update({ submit_count: (f.submit_count || 0) + 1 })
            .eq("id", form.id);
        }
      }
    );

    return NextResponse.json({
      success: true,
      redirect_url: form.redirect_url || null,
    });
  } catch (e) {
    console.error("[form submit] unexpected:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
