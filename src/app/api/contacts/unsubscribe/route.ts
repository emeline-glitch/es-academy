import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/utils/unsubscribe-token";
import { sendEmail } from "@/lib/ses/client";
import { validateBody } from "@/lib/validators/validate";
import { UnsubscribeRequestSchema } from "@/lib/validators/unsubscribe";

/**
 * POST /api/contacts/unsubscribe
 *
 * 2 paths conformes RGPD article 21 (droit d'opposition) :
 *
 * Path 1 : 1-click via lien email (recommande)
 *   Body : { email, token }
 *   Le token HMAC prouve que la requete vient du destinataire legitime
 *   du mail (cf src/lib/utils/unsubscribe-token.ts).
 *   Unsubscribe immediat + audit log.
 *
 * Path 2 : form manuel (fallback si user a perdu le mail)
 *   Body : { email, source: "manual" }
 *   Pas de token = on ne peut pas garantir l'identite du demandeur.
 *   On envoie un mail de confirmation avec un lien token. Le user
 *   doit cliquer pour confirmer = preuve de possession de la boite.
 *   Pas d'unsubscribe immediat.
 *
 * Toute autre forme (email seul sans token ni source manual) est
 * rejetee avec 400 pour eviter le revenge-unsubscribe.
 */

export async function POST(request: Request) {
  try {
    const v = await validateBody(request, UnsubscribeRequestSchema);
    if (!v.ok) return v.response;
    const { email, token, source } = v.data;

    const supabase = await createServiceClient();

    // === Path 1 : token valide -> unsubscribe immediat ===
    if (token) {
      const valid = verifyUnsubscribeToken(email, token);
      if (!valid) {
        return NextResponse.json(
          { error: "Lien de desabonnement invalide ou expire" },
          { status: 400 }
        );
      }

      const { data: existing, error: selectErr } = await supabase
        .from("contacts")
        .select("id, status")
        .eq("email", email)
        .maybeSingle();

      if (selectErr) {
        return NextResponse.json({ error: selectErr.message }, { status: 500 });
      }

      // Idempotence : si deja unsubscribed, on retourne success sans rien faire
      if (existing?.status === "unsubscribed") {
        return NextResponse.json({ success: true, already: true });
      }

      const { error: updateErr } = await supabase
        .from("contacts")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Audit log + consent log pour preuve RGPD
      await supabase.from("audit_log").insert({
        action: "contact_unsubscribed",
        entity_type: "contact",
        entity_id: existing?.id || null,
        after: {
          email,
          previous_status: existing?.status || "unknown",
          method: "token_link",
        },
      });

      // Best-effort : consent_log si dispo (table peut ne pas exister sur tous les envs)
      try {
        await supabase.from("consent_log").insert({
          email,
          consent_type: "marketing",
          action: "withdrawn",
          basis: "user_request_token_link",
          proof: { source: "unsubscribe_endpoint", token_verified: true },
        });
      } catch {
        // best-effort
      }

      return NextResponse.json({ success: true });
    }

    // === Path 2 : form manuel -> envoyer email de confirmation ===
    if (source === "manual") {
      // On ne reveal PAS si l'email existe en DB (anti-enumeration).
      // On envoie le mail de confirmation quoi qu'il arrive : si l'adresse
      // n'existe pas en base, le mail part dans le vide, pas grave.
      const confirmUrl = buildUnsubscribeUrl(email);

      const html = `
        <p>Tu as demande a te desabonner de nos communications avec l'email <strong>${email}</strong>.</p>
        <p>Pour confirmer, clique sur ce lien :</p>
        <p><a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#2c6e55;color:#fff;text-decoration:none;border-radius:8px;">Confirmer mon desabonnement</a></p>
        <p style="color:#666;font-size:13px;">Si tu n'es pas a l'origine de cette demande, ignore simplement ce mail. Tu resteras abonne.</p>
      `;

      await sendEmail({
        to: email,
        subject: "Confirme ton desabonnement",
        html,
      });

      return NextResponse.json({ success: true, manual: true });
    }

    // === Sinon : rejet ===
    return NextResponse.json(
      {
        error:
          "Lien de desabonnement requis ou utilise le formulaire avec source 'manual'.",
      },
      { status: 400 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[unsubscribe] error:", msg);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
