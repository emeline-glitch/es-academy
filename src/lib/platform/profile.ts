import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

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
 *
 * Champs Stripe live (enriched) : currentPeriodEnd, paidCount, installments,
 * stripeStatus, invoices[]. Best-effort : si Stripe est lent/indispo, ces
 * champs restent null mais la fiche s'affiche quand meme.
 */
export interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  paid: boolean;
  amountCents: number;
  createdAt: string;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

export interface PaymentSummary {
  id: string;
  kind: "academy" | "family";
  productName: string;
  purchasedAt: string;
  amount: number;
  status: string;
  invoiceUrl: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  installments: number;
  stripeStatus: string | null;
  currentPeriodEnd: string | null;
  paidCount: number;
  cancelAtPeriodEnd: boolean;
  invoices: InvoiceSummary[];
}

export async function getPaymentSummaries(
  supabase: SupabaseClient,
  userId: string,
): Promise<PaymentSummary[]> {
  const [enrollRes, famRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, product_name, purchased_at, amount_paid, status, installments, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("family_subscriptions")
      .select("id, status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at")
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
      stripeSubscriptionId: (e.stripe_subscription_id as string | null) ?? null,
      installments: (e.installments as number) || 1,
      stripeStatus: null,
      currentPeriodEnd: null,
      paidCount: 0,
      cancelAtPeriodEnd: false,
      invoices: [],
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
      stripeSubscriptionId: (f.stripe_subscription_id as string | null) ?? null,
      installments: 1,
      stripeStatus: null,
      currentPeriodEnd: null,
      paidCount: 0,
      cancelAtPeriodEnd: false,
      invoices: [],
    });
  }

  // Enrichissement Stripe live : pour chaque payment ayant une subscription,
  // recupere statut + invoices. Best-effort : si timeout/erreur Stripe, on
  // laisse les champs par defaut et la fiche s'affiche quand meme.
  await Promise.all(
    items.map(async (item) => {
      if (!item.stripeSubscriptionId) return;
      try {
        const stripe = getStripe();
        const [sub, invoices] = await Promise.all([
          stripe.subscriptions.retrieve(item.stripeSubscriptionId),
          stripe.invoices.list({ subscription: item.stripeSubscriptionId, limit: 12 }),
        ]);
        const periodEnd = (sub.items?.data?.[0] as Stripe.SubscriptionItem | undefined)
          ?.current_period_end ?? null;
        const paidInvoices = invoices.data.filter((i) => i.status === "paid");
        item.stripeStatus = sub.status;
        item.cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
        item.currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
        item.paidCount = paidInvoices.length;
        item.invoices = invoices.data.map((i) => ({
          id: i.id ?? "",
          number: i.number || null,
          status: i.status || null,
          paid: i.status === "paid",
          amountCents: i.amount_paid || i.amount_due || 0,
          createdAt: new Date(i.created * 1000).toISOString(),
          invoicePdf: i.invoice_pdf || null,
          hostedInvoiceUrl: i.hosted_invoice_url || null,
        }));
      } catch (err) {
        console.error(`[profile] Stripe enrich failed for ${item.id}:`, err);
      }
    })
  );

  return items.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
}
