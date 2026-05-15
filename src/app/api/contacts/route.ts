import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, cleanupBuckets } from "@/lib/utils/rate-limit";
import { requireAdmin } from "@/lib/utils/admin-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    cleanupBuckets();

    // Si c'est un admin connecté, bypass rate limit
    const auth = await requireAdmin();
    const isAdmin = auth.ok;

    if (!isAdmin) {
      const ip = getClientIp(request);
      const ipCheck = rateLimit(`contacts:ip:${ip}`, 5, 60_000); // 5 req / minute / IP
      const hourCheck = rateLimit(`contacts:ip-hour:${ip}`, 30, 60 * 60_000); // 30 req / heure / IP
      if (!ipCheck.allowed || !hourCheck.allowed) {
        return NextResponse.json(
          { error: "Trop de requêtes, réessaie plus tard." },
          { status: 429, headers: { "Retry-After": String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)) } }
        );
      }
    }

    const body = await request.json();
    const { email, first_name, last_name, source, tags, metadata, phone } = body;

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    // Anti-pourriel : payload trop long
    if ((first_name && first_name.length > 100) || (last_name && last_name.length > 100)) {
      return NextResponse.json({ error: "Nom/prénom trop long" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Pour les soumissions publiques (newsletter, leads externes), on passe
    // par la RPC upsert_contact_with_tags qui MERGE les tags existants au
    // lieu d'écraser. Sans ca, un client existant qui s'inscrit a la
    // newsletter perdrait son tag 'client' et serait re-traite comme un
    // prospect frais. La RPC preserve aussi le status 'unsubscribed' (opt-out
    // RGPD prime sur toute resoumission).
    const tagsToApply = (Array.isArray(tags) && tags.length > 0 ? tags : ["newsletter"]) as string[];
    if (!isAdmin) {
      const { error: rpcErr } = await supabase.rpc("upsert_contact_with_tags", {
        p_email: email.toLowerCase().trim(),
        p_first_name: first_name || "",
        p_last_name: last_name || "",
        p_add_tags: tagsToApply,
        p_source: source || "website",
      });
      if (rpcErr) {
        console.error("Contact upsert RPC error:", rpcErr);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }
      // Phone fourni : update separe (la RPC ne gere pas ce champ)
      if (phone !== undefined) {
        const phoneVal = phone ? String(phone).trim() : null;
        await supabase.from("contacts").update({ phone: phoneVal }).eq("email", email.toLowerCase().trim());
      }
    } else {
      // Admin : upsert direct (admin force les valeurs, ex : import CSV).
      const upsertData: Record<string, unknown> = {
        email: email.toLowerCase().trim(),
        first_name: first_name || "",
        last_name: last_name || "",
        source: source || "website",
        tags: tagsToApply,
        status: "active",
      };
      if (phone !== undefined) upsertData.phone = phone ? String(phone).trim() : null;

      const { error } = await supabase.from("contacts").upsert(upsertData, { onConflict: "email" });
      if (error) {
        console.error("Contact insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (metadata) {
      console.log("[Simulator Capture]", {
        email,
        source,
        metadata,
      });
    }

    // Invalidate les pages admin qui affichent la liste/compteur
    if (isAdmin) {
      revalidatePath("/admin/contacts");
      revalidatePath("/admin/dashboard");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Vérification admin via cookies (createServiceClient bypasse RLS mais n'a plus de cookies)
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServiceClient();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("subscribed_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    // Search : email + nom + prénom + téléphone (les 4 sont indexés via pg_trgm gin - migration 006)
    const s = search.replace(/%/g, "").replace(/,/g, "");
    query = query.or(
      `email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%`
    );
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    contacts: data,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
