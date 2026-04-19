import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  const entityType = searchParams.get("entity_type") || "";
  const since = searchParams.get("since") || ""; // ISO date
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 50;

  const supabase = await createServiceClient();
  let q = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (action) q = q.eq("action", action);
  if (entityType) q = q.eq("entity_type", entityType);
  if (since) q = q.gte("created_at", since);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data || [], total: count || 0, page, pageSize });
}
