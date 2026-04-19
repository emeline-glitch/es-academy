import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const product = searchParams.get("product") || ""; // academy | expert | all
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "30")));

  const supabase = await createServiceClient();

  // Charger enrollments + profiles liés
  let enrollQuery = supabase
    .from("enrollments")
    .select(
      `id, product_name, amount_paid, purchased_at, status,
       profiles:user_id (id, full_name, email, coaching_credits_total, coaching_credits_used, created_at)`,
      { count: "exact" }
    )
    .order("purchased_at", { ascending: false });

  if (product && product !== "all") {
    enrollQuery = enrollQuery.eq("product_name", product);
  }

  const { data: enrollments, count, error } = await enrollQuery.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filtrage search côté app sur le nom/email (on ne peut pas filtrer via la relation facilement)
  let filtered = enrollments || [];
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((e) => {
      const p = e.profiles as { full_name?: string; email?: string } | null;
      return (
        (p?.full_name || "").toLowerCase().includes(needle) ||
        (p?.email || "").toLowerCase().includes(needle)
      );
    });
  }

  // Progress count par user
  const userIds = filtered
    .map((e) => (e.profiles as { id?: string } | null)?.id)
    .filter((x): x is string => !!x);

  const progressByUser: Record<string, number> = {};
  const lastProgressByUser: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: progress } = await supabase
      .from("progress")
      .select("user_id, completed_at")
      .in("user_id", userIds)
      .order("completed_at", { ascending: false });
    for (const p of progress || []) {
      progressByUser[p.user_id] = (progressByUser[p.user_id] || 0) + 1;
      if (!lastProgressByUser[p.user_id] && p.completed_at) {
        lastProgressByUser[p.user_id] = p.completed_at;
      }
    }
  }

  // Last sign-in : on tire un seul listUsers pour tous les élèves visibles
  const lastSignInByUser: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authList?.users || []) {
      if (userIds.includes(u.id)) {
        lastSignInByUser[u.id] = u.last_sign_in_at || null;
      }
    }
  }

  // KPIs globaux
  const [{ count: totalEleves }, monthEnrollments] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("amount_paid, purchased_at").gte(
      "purchased_at",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    ),
  ]);

  const monthCount = (monthEnrollments.data || []).length;
  const monthRevenue = (monthEnrollments.data || []).reduce((s, e) => s + (e.amount_paid || 0), 0);

  return NextResponse.json({
    enrollments: filtered.map((e) => {
      const uid = (e.profiles as { id?: string } | null)?.id || "";
      return {
        ...e,
        progress_count: progressByUser[uid] || 0,
        last_progress_at: lastProgressByUser[uid] || null,
        last_sign_in_at: lastSignInByUser[uid] || null,
      };
    }),
    total: count || 0,
    page,
    pageSize,
    kpis: {
      total_eleves: totalEleves || 0,
      month_count: monthCount,
      month_revenue: monthRevenue,
    },
  });
}
