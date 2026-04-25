import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId } = await params;
  const supabase = await createServiceClient();

  // Parallèle : profil, enrollments, progress (toutes leçons), quiz, notes, auth info
  const [profileRes, enrollRes, progressRes, quizRes, notesRes, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, coaching_credits_total, coaching_credits_used, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("id, product_name, amount_paid, purchased_at, status, course_id, family_gift_code, family_gift_email_sent_at, family_gift_email_attempts, family_gift_email_last_error")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("progress")
      .select("id, lesson_id, course_id, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("quiz_results")
      .select("quiz_id, lesson_id, score, passed, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("coaching_notes")
      .select("id, content, created_at, author_id")
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase.auth.admin.getUserById(userId),
  ]);

  if (profileRes.error && !profileRes.data) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const authUser = authRes.data?.user;

  // Dernière activité = max(derniere leçon complétée, dernière connexion)
  const lastProgressAt = progressRes.data?.[0]?.completed_at || null;
  const lastSignInAt = authUser?.last_sign_in_at || null;
  const createdAt = authUser?.created_at || profileRes.data?.created_at || null;

  // Stats par course_id (pour le cas où plusieurs cours)
  const progressByCourse: Record<string, number> = {};
  for (const p of progressRes.data || []) {
    const cid = p.course_id || "default";
    progressByCourse[cid] = (progressByCourse[cid] || 0) + 1;
  }

  return NextResponse.json({
    profile: profileRes.data,
    auth: {
      email: authUser?.email || profileRes.data?.email || null,
      last_sign_in_at: lastSignInAt,
      created_at: createdAt,
      email_confirmed_at: authUser?.email_confirmed_at || null,
    },
    enrollments: enrollRes.data || [],
    progress: progressRes.data || [],
    progress_by_course: progressByCourse,
    last_progress_at: lastProgressAt,
    quiz_results: quizRes.data || [],
    notes: notesRes.data || [],
  });
}
