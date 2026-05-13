import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Enrollment "actif" tel que vu cote eleve : on garde uniquement les colonnes
 * utiles a l'affichage dashboard / cours. On expose un type narrow pour eviter
 * que les pages tirent par hasard des colonnes financieres (amount_paid, etc).
 */
export interface ActiveEnrollment {
  id: string;
  course_id: string | null;
  product_name: string;
  purchased_at: string;
}

/**
 * Récupère les enrollments actifs (status = active) d'un user, ordonnes par
 * date d'achat decroissante. Cas typique : 1 row ("methode-emeline-siron")
 * mais on supporte le multi (futures formations).
 */
export async function getActiveEnrollments(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveEnrollment[]> {
  const { data } = await supabase
    .from("enrollments")
    .select("id, course_id, product_name, purchased_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("purchased_at", { ascending: false });

  return (data || []) as ActiveEnrollment[];
}

/**
 * Vérifie si un user a un enrollment actif sur un course_id donne.
 * Utilise pour gating sur /cours/[courseSlug] : si false, redirect dashboard.
 *
 * Note : on ne se repose PAS uniquement sur RLS car les pages utilisent un
 * service client (par le layout (platform)). Le gating est explicite ici.
 */
export async function hasActiveEnrollmentForCourse(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("course_id", courseId)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Compte les leçons terminées par course_id pour un user.
 * Retourne un map { courseId: completedCount } pour eviter N+1 sur dashboard.
 */
export async function getCompletedCountsByCourse(
  supabase: SupabaseClient,
  userId: string,
  courseIds: string[],
): Promise<Record<string, number>> {
  if (courseIds.length === 0) return {};

  const { data } = await supabase
    .from("progress")
    .select("course_id")
    .eq("user_id", userId)
    .in("course_id", courseIds);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const cid = row.course_id as string | null;
    if (!cid) continue;
    counts[cid] = (counts[cid] || 0) + 1;
  }
  return counts;
}
