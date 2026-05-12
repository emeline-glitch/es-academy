import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/utils/admin-auth";

/**
 * POST /api/admin/seo/revalidate-blog
 *
 * Force la purge du cache Next.js des queries Notion blog (tag "notion-blog").
 * A appeler apres une mise a jour en masse des SEO_Title / Excerpt / etc.
 * via les scripts d'admin (sinon il faut attendre 1h ou redeployer).
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Next.js 16 : revalidateTag requiert un profil cacheLife (stale window).
  // "max" = invalidation immediate avec stale-while-revalidate max.
  revalidateTag("notion-blog", "max");
  revalidatePath("/blog");
  revalidatePath("/admin/seo");

  return NextResponse.json({ ok: true, tag: "notion-blog", revalidated_at: new Date().toISOString() });
}
