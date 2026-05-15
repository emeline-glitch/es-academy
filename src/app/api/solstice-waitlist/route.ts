import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, cleanupBuckets } from "@/lib/utils/rate-limit";
import { z } from "zod";

/**
 * POST public /api/solstice-waitlist : inscription liste d'attente Solstice.
 *
 * Solstice Patrimoine est en cours d'ouverture (site solstice-patrimoine.fr
 * pas encore live). Cette liste collecte les leads interesses pour qu'Antony
 * les recontacte au lancement.
 *
 * Flow :
 * - Rate limit IP (3/min + 20/h) pour eviter le spam
 * - Upsert atomique du contact via RPC upsert_contact_with_tags
 *   - Tag `waitlist:solstice` (filtre dans /admin/contacts par tag)
 *   - Source `solstice_waitlist`
 * - Anti-enum : on retourne toujours ok meme si l'email existe deja
 *   (le user voit la confirmation, on ne leak pas l'etat du CRM).
 */

const Schema = z.object({
  email: z.string().email("Email invalide").max(200),
  first_name: z.string().trim().max(80).optional().default(""),
  last_name: z.string().trim().max(80).optional().default(""),
});

export async function POST(request: Request) {
  try {
    cleanupBuckets();

    const ip = getClientIp(request);
    const ipCheck = rateLimit(`solstice-waitlist:ip:${ip}`, 3, 60_000);
    const ipHour = rateLimit(`solstice-waitlist:ip-hour:${ip}`, 20, 60 * 60_000);
    if (!ipCheck.allowed || !ipHour.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives, réessaie plus tard." },
        { status: 429 },
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 },
      );
    }

    const { email, first_name, last_name } = parsed.data;

    const supabase = await createServiceClient();

    const { error: upsertErr } = await supabase.rpc("upsert_contact_with_tags", {
      p_email: email.toLowerCase().trim(),
      p_first_name: first_name,
      p_last_name: last_name,
      p_add_tags: ["waitlist:solstice"],
      p_source: "solstice_waitlist",
    });

    if (upsertErr) {
      console.error("[solstice-waitlist] upsert error:", upsertErr.message);
      // Anti-enum : on retourne ok meme en cas d'echec interne.
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[solstice-waitlist] unexpected:", msg);
    return NextResponse.json({ ok: true });
  }
}
