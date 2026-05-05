import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runSeoAudit } from "@/lib/seo/audit";
import { requireAdmin } from "@/lib/utils/admin-auth";

/**
 * POST /api/admin/seo/audit -> lance un audit complet (manuel depuis l'admin)
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await runSeoAudit();
    revalidatePath("/admin/seo");
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
