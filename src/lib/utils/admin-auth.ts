import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie que l'utilisateur courant est admin.
 * Accepte 2 mécanismes (OR) :
 *  1. user.email présent dans process.env.ADMIN_EMAIL (csv supporté)
 *  2. profile.role === 'admin' en DB
 *
 * Retourne le client supabase et le user en cas de succès pour éviter
 * un second appel createClient() côté caller.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Non authentifié" };

  // Check 1 : email admin (csv supporté pour gérer Emeline + futurs comptes admin)
  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase())) {
    return { ok: true as const, userId: user.id, user, supabase };
  }

  // Check 2 : role en DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") {
    return { ok: true as const, userId: user.id, user, supabase };
  }

  return { ok: false as const, status: 403 as const, error: "Accès réservé aux admins" };
}
