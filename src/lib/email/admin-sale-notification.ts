import type { SupabaseClient } from "@supabase/supabase-js";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/ses/client";
import { formatMoney, htCents } from "@/lib/utils/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";
const ADMIN_NOTIF_EMAIL =
  process.env.ADMIN_NOTIF_EMAIL || "emeline@emeline-siron.fr";

interface Params {
  supabase: SupabaseClient;
  product: "academy" | "family";
  plan: string;
  amountTtcCents: number;
  vatRate?: number;
  clientEmail: string;
  clientName: string;
  enrollmentId?: string | null;
}

/**
 * Notifie Emeline d'une nouvelle vente (Stripe checkout.session.completed).
 *
 * Best-effort : on swallow toute erreur SES pour ne pas bloquer le webhook.
 * L'idempotence est assuree en amont par les callers (handleAcademyPurchase
 * verifie family_gift_email_sent_at, handleFamilyPurchase verifie
 * welcome_email_sent_at). On envoie cote notif uniquement dans ces blocs.
 *
 * Recipient : ADMIN_NOTIF_EMAIL env var (fallback emeline@emeline-siron.fr).
 * Pour ne plus recevoir : supprimer le template admin_sale_notification
 * depuis /admin/emails/templates.
 */
export async function sendAdminSaleNotification(params: Params): Promise<void> {
  try {
    const { supabase, product, plan, amountTtcCents, vatRate = 0.2, clientEmail, clientName, enrollmentId } = params;

    // Lookup source d'acquisition + contact_id pour le lien "Voir la fiche"
    const emailLc = clientEmail.toLowerCase();
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, source, first_name")
      .eq("email", emailLc)
      .maybeSingle();

    const productLabel = product === "academy" ? "Academy" : "Family";
    const planLabel = product === "academy"
      ? `${plan} (paiement en ${plan})`
      : plan === "fondateur"
        ? "Fondateur (19€/mois)"
        : "Standard (29€/mois)";

    const amountHtCents = htCents(amountTtcCents, vatRate);
    const contactUrl = contact?.id
      ? `${SITE_URL}/admin/contacts/${contact.id}`
      : `${SITE_URL}/admin/contacts`;

    const rendered = await renderEmailTemplate("admin_sale_notification", {
      product: productLabel,
      plan: planLabel,
      amount_ttc: formatMoney(amountTtcCents),
      amount_ht: `${formatMoney(amountHtCents)} HT`,
      client_name: clientName || clientEmail,
      client_email: clientEmail,
      source: contact?.source || "(non renseignée)",
      contact_url: contactUrl,
      enrollment_id: enrollmentId || "",
    });

    if (!rendered) {
      console.warn("[admin-sale-notif] template admin_sale_notification introuvable, skip");
      return;
    }

    const res = await sendEmail({
      to: ADMIN_NOTIF_EMAIL,
      subject: rendered.subject,
      html: rendered.html,
      from: `${rendered.from_name} <${rendered.from_email}>`,
      replyTo: rendered.reply_to || undefined,
    });

    if (!res.success) {
      console.error("[admin-sale-notif] SES send failed:", res.error);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[admin-sale-notif] unexpected error:", msg);
  }
}
