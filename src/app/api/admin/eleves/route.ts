import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const product = searchParams.get("product") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "30")));

  const supabase = await createServiceClient();

  // 1. Charger enrollments (pas de join avec profiles — la FK pointe vers auth.users)
  let enrollQuery = supabase
    .from("enrollments")
    .select("id, user_id, product_name, amount_paid, purchased_at, status, course_id", { count: "exact" })
    .order("purchased_at", { ascending: false });

  if (product && product !== "all") {
    enrollQuery = enrollQuery.eq("product_name", product);
  }

  const { data: enrollRaw, count, error: enrollErr } = await enrollQuery.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  if (enrollErr) {
    return NextResponse.json({ error: enrollErr.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((enrollRaw || []).map((e) => e.user_id).filter(Boolean)));

  // 2. Fetch profiles correspondants
  const profilesById: Record<string, { id: string; full_name: string | null; email: string | null; coaching_credits_total: number; coaching_credits_used: number; created_at: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, coaching_credits_total, coaching_credits_used, created_at")
      .in("id", userIds);
    for (const p of profiles || []) {
      profilesById[p.id] = p;
    }
  }

  // 3. Progress count + last progress + last sign in par user
  const progressByUser: Record<string, number> = {};
  const lastProgressByUser: Record<string, string> = {};
  const lastSignInByUser: Record<string, string | null> = {};

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

    // Batch fetch auth users for last_sign_in_at
    try {
      const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      for (const u of authList?.users || []) {
        if (userIds.includes(u.id)) {
          lastSignInByUser[u.id] = u.last_sign_in_at || null;
        }
      }
    } catch {
      // Ignore : last sign in est non-critique
    }
  }

  // 4. Assembler + filtrer search côté app
  let items = (enrollRaw || []).map((e) => {
    const profile = profilesById[e.user_id] || null;
    return {
      id: e.id,
      product_name: e.product_name,
      amount_paid: e.amount_paid,
      purchased_at: e.purchased_at,
      status: e.status,
      course_id: e.course_id,
      profiles: profile,
      progress_count: progressByUser[e.user_id] || 0,
      last_progress_at: lastProgressByUser[e.user_id] || null,
      last_sign_in_at: lastSignInByUser[e.user_id] || null,
    };
  });

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((e) => {
      const p = e.profiles;
      return (
        (p?.full_name || "").toLowerCase().includes(needle) ||
        (p?.email || "").toLowerCase().includes(needle)
      );
    });
  }

  // 5. KPIs globaux
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
    enrollments: items,
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
