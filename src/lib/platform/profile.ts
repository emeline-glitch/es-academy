import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPreferences {
  email_weekly_digest: boolean;
  email_lives: boolean;
  email_new_content: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_weekly_digest: true,
  email_lives: true,
  email_new_content: true,
};

export interface LearnerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  notification_preferences: NotificationPreferences;
  coaching_credits_total: number;
  coaching_credits_used: number;
  role: string;
}

/**
 * Lit le profil eleve avec defaults sains si la row n'existe pas encore
 * (trigger handle_new_user devrait toujours la créer, mais on est defensif).
 */
export async function getLearnerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<LearnerProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, city, bio, notification_preferences, coaching_credits_total, coaching_credits_used, role",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const prefs = (data.notification_preferences as Partial<NotificationPreferences>) || {};
  return {
    id: data.id as string,
    full_name: (data.full_name as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    notification_preferences: {
      email_weekly_digest: prefs.email_weekly_digest ?? DEFAULT_NOTIFICATION_PREFERENCES.email_weekly_digest,
      email_lives: prefs.email_lives ?? DEFAULT_NOTIFICATION_PREFERENCES.email_lives,
      email_new_content: prefs.email_new_content ?? DEFAULT_NOTIFICATION_PREFERENCES.email_new_content,
    },
    coaching_credits_total: (data.coaching_credits_total as number | null) ?? 0,
    coaching_credits_used: (data.coaching_credits_used as number | null) ?? 0,
    role: (data.role as string | null) ?? "user",
  };
}

/**
 * Résumé de paiement affiche dans /profil. Récupère les enrollments + les
 * family_subscriptions pour l'eleve. On expose une vue plate, triee par date.
 */
export interface PaymentSummary {
  id: string;
  kind: "academy" | "family";
  productName: string;
  purchasedAt: string;
  amount: number;
  status: string;
  invoiceUrl: string | null;
  stripeCustomerId: string | null;
}

export async function getPaymentSummaries(
  supabase: SupabaseClient,
  userId: string,
): Promise<PaymentSummary[]> {
  const [enrollRes, famRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, product_name, purchased_at, amount_paid, status, stripe_customer_id")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("family_subscriptions")
      .select("id, status, current_period_end, stripe_customer_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const items: PaymentSummary[] = [];

  for (const e of enrollRes.data || []) {
    items.push({
      id: `enrollment_${e.id}`,
      kind: "academy",
      productName: (e.product_name as string) || "Academy",
      purchasedAt: (e.purchased_at as string) || (e.status as string) || "",
      amount: ((e.amount_paid as number) || 0) / 100,
      status: (e.status as string) || "active",
      invoiceUrl: null,
      stripeCustomerId: (e.stripe_customer_id as string | null) ?? null,
    });
  }

  for (const f of famRes.data || []) {
    items.push({
      id: `family_${f.id}`,
      kind: "family",
      productName: "ES Family (abonnement)",
      purchasedAt: (f.created_at as string) || "",
      amount: 0,
      status: (f.status as string) || "active",
      invoiceUrl: null,
      stripeCustomerId: (f.stripe_customer_id as string | null) ?? null,
    });
  }

  return items.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
}
