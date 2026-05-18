import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, cleanupBuckets } from "@/lib/utils/rate-limit";
import { autoEnrollByTags, tagsAdded } from "@/lib/sequences/auto-enroll";
import { validateBody } from "@/lib/validators/validate";
import { FormSubmissionSchema } from "@/lib/validators/form-submission";

/**
 * POST public /api/forms/[slug]/submit : soumission publique du formulaire.
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
    const v = await validateBody(request, FormSubmissionSchema);
    if (!v.ok) return v.response;
    const { email, first_name, last_name, phone } = v.data;

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

    // 3. Upsert atomique via RPC (merge tags + préservation status RGPD,
    //    + retour des previous_tags pour calculer les "newly added" sans race).
    //    La RPC ne gère pas phone : on fait un UPDATE séparé après si nécessaire.
    const emailLower = email.toLowerCase().trim();
    const { data: rpcResult, error: upsertErr } = await supabase
      .rpc("upsert_contact_with_tags", {
        p_email: emailLower,
        p_first_name: (first_name || "").trim(),
        p_last_name: (last_name || "").trim(),
        p_add_tags: tags,
        p_source: `form:${slug}`,
      });

    if (upsertErr || !rpcResult || rpcResult.length === 0) {
      console.error("[form submit] upsert RPC error:", upsertErr);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const contactId = rpcResult[0].id as string;
    const previousTags = (rpcResult[0].previous_tags || []) as string[];

    // Update phone si fourni (la RPC n'écrit pas phone, on overwrite simple).
    if (phone?.trim()) {
      await supabase
        .from("contacts")
        .update({ phone: phone.trim() })
        .eq("id", contactId);
    }

    // 4bis. Auto-enrollment : enroll dans les séquences actives dont le trigger_value
    // matche un NOUVEAU tag (pas déjà présent avant ce submit).
    const newlyAdded = tagsAdded(previousTags, tags);
    if (newlyAdded.length > 0) {
      await autoEnrollByTags(supabase, contactId, newlyAdded);
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

    // Pose le cookie es-lead-email pour pre-remplir Stripe Checkout +
    // tracker les futurs abandons de panier. 90 jours = fenetre courante
    // d'un parcours d'achat. HttpOnly false car lu cote JS pour le checkout
    // Academy (les boutons CTA AcademyCheckoutButtons).
    const response = NextResponse.json({
      success: true,
      redirect_url: form.redirect_url || null,
    });
    response.cookies.set("es-lead-email", emailLower, {
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });
    return response;
  } catch (e) {
    console.error("[form submit] unexpected:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
