import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie que l'utilisateur courant est admin.
 * Accepte 2 mécanismes (OR) :
 *  1. profile.role === 'admin' en DB
 *  2. user.email === process.env.ADMIN_EMAIL
 * Le 2e permet de gérer l'admin sans avoir eu besoin de setter le role en DB.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Non authentifié" };

  // Check 1 : email admin
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (adminEmail && user.email?.toLowerCase() === adminEmail) {
    return { ok: true as const, userId: user.id };
  }

  // Check 2 : role en DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") {
    return { ok: true as const, userId: user.id };
  }

  return { ok: false as const, status: 403 as const, error: "Accès réservé aux admins" };
}
