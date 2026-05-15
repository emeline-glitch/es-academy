import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, isOwnerEmail } from "@/lib/utils/admin-auth";
import { getStripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const isOwner = isOwnerEmail(auth.user.email);

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
      .select("id, product_name, amount_paid, purchased_at, status, course_id, installments, stripe_customer_id, stripe_subscription_id, family_gift_code, family_gift_email_sent_at, family_gift_email_attempts, family_gift_email_last_error")
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

  // Recupere le contact CRM associe (par email) pour avoir la source
  // d'acquisition + les tags lm:xxx (parcours lead magnets). Eleve sans
  // contact CRM peut arriver si import legacy, on degrade gracieusement.
  const eleveEmail = authUser?.email || profileRes.data?.email;
  const { data: crmContact } = eleveEmail
    ? await supabase
        .from("contacts")
        .select("id, source, primary_source, primary_source_detail, tags, subscribed_at")
        .eq("email", eleveEmail.toLowerCase())
        .maybeSingle()
    : { data: null };

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

  // Enrichissement Stripe live (factures + statut sub) : reserve aux owners.
  // Pour les admins secondaires, on saute Stripe + on strip amount_paid des
  // enrollments pour ne pas afficher les chiffres financiers.
  const stripeByEnrollment: Record<string, StripeEnrichment | null> = {};
  if (isOwner) {
    const enrichments = await Promise.all(
      (enrollRes.data || []).map((e) => fetchStripeEnrichment(e.id, e.stripe_subscription_id))
    );
    for (const en of enrichments) {
      if (en) stripeByEnrollment[en.enrollment_id] = en;
    }
  }

  const enrollments = (enrollRes.data || []).map((e) => ({
    ...e,
    amount_paid: isOwner ? e.amount_paid : null,
  }));

  return NextResponse.json({
    is_owner: isOwner,
    profile: profileRes.data,
    auth: {
      email: authUser?.email || profileRes.data?.email || null,
      last_sign_in_at: lastSignInAt,
      created_at: createdAt,
      email_confirmed_at: authUser?.email_confirmed_at || null,
    },
    crm_contact: crmContact || null,
    enrollments,
    stripe_by_enrollment: stripeByEnrollment,
    progress: progressRes.data || [],
    progress_by_course: progressByCourse,
    last_progress_at: lastProgressAt,
    quiz_results: quizRes.data || [],
    notes: notesRes.data || [],
  });
}

interface StripeInvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  paid: boolean;
  amount_paid_cents: number;
  amount_due_cents: number;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

interface StripeEnrichment {
  enrollment_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  paid_count: number;
  invoices: StripeInvoiceSummary[];
  error?: string;
}

async function fetchStripeEnrichment(
  enrollmentId: string,
  subscriptionId: string | null
): Promise<StripeEnrichment | null> {
  if (!subscriptionId) return null;
  try {
    const stripe = getStripe();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const [sub, invoices] = await Promise.all([
        stripe.subscriptions.retrieve(subscriptionId),
        stripe.invoices.list({ subscription: subscriptionId, limit: 12 }),
      ]);
      const periodEnd = (sub.items?.data?.[0] as Stripe.SubscriptionItem | undefined)
        ?.current_period_end ?? null;
      const paidInvoices = invoices.data.filter((i) => i.status === "paid");
      return {
        enrollment_id: enrollmentId,
        status: sub.status,
        cancel_at_period_end: Boolean(sub.cancel_at_period_end),
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        paid_count: paidInvoices.length,
        invoices: invoices.data.map((i) => ({
          id: i.id ?? "",
          number: i.number || null,
          status: i.status || null,
          paid: i.status === "paid",
          amount_paid_cents: i.amount_paid || 0,
          amount_due_cents: i.amount_due || 0,
          created_at: new Date(i.created * 1000).toISOString(),
          period_start: i.period_start ? new Date(i.period_start * 1000).toISOString() : null,
          period_end: i.period_end ? new Date(i.period_end * 1000).toISOString() : null,
          invoice_pdf: i.invoice_pdf || null,
          hosted_invoice_url: i.hosted_invoice_url || null,
        })),
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error(`[admin/eleves] Stripe enrich failed for enrollment ${enrollmentId}:`, err);
    return {
      enrollment_id: enrollmentId,
      status: "unknown",
      cancel_at_period_end: false,
      current_period_end: null,
      paid_count: 0,
      invoices: [],
      error: "stripe_unavailable",
    };
  }
}
