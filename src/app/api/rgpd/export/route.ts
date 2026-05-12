import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/rgpd/export
 *
 * Export RGPD article 15 : restitue toutes les données personnelles du
 * user authentifié sous forme d'un JSON téléchargeable.
 *
 * Auth : cookie session Supabase (SSR). Renvoie 401 si non connecté.
 *
 * Périmètre :
 *  - profile (infos perso, préférences, coaching credits)
 *  - enrollments (formations achetées, montants, dates)
 *  - progress (leçons complétées avec timestamps)
 *  - quiz_results (scores quiz V1 + examen final)
 *  - family_subscriptions (abonnement Family si présent)
 *  - contacts (entrée CRM si l'email est présent — lié par email, pas user_id)
 *  - consent_log (preuves de consentement RGPD)
 *
 * Réponse : application/json, Content-Disposition attachment pour que le
 * navigateur download au lieu d'afficher inline. La page /profil > RgpdActions
 * convertit ce blob en download via createObjectURL.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Service role pour bypass RLS sur toutes les tables. Pas de fuite : on
  // filtre strictement sur user.id / user.email, donc le user ne voit que
  // ses propres données.
  const admin = await createServiceClient();
  const userEmail = (user.email || "").toLowerCase();

  const [
    profileRes,
    enrollmentsRes,
    progressRes,
    quizResultsRes,
    familySubRes,
    contactsRes,
    consentLogRes,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("enrollments").select("*").eq("user_id", user.id),
    admin.from("progress").select("*").eq("user_id", user.id),
    admin.from("quiz_results").select("*").eq("user_id", user.id),
    admin.from("family_subscriptions").select("*").eq("user_id", user.id),
    userEmail ? admin.from("contacts").select("*").eq("email", userEmail) : Promise.resolve({ data: [] }),
    userEmail ? admin.from("consent_log").select("*").eq("email", userEmail) : Promise.resolve({ data: [] }),
  ]);

  const payload = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      legal_basis: "RGPD article 15 — droit d'accès aux données personnelles",
      data_controller: "ES Academy SASU, RCS Nanterre 104020078",
      contact: "contact@emeline-siron.fr",
    },
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      user_metadata: user.user_metadata,
    },
    profile: profileRes.data || null,
    enrollments: enrollmentsRes.data || [],
    progress: progressRes.data || [],
    quiz_results: quizResultsRes.data || [],
    family_subscriptions: familySubRes.data || [],
    contacts_crm: contactsRes.data || [],
    consent_log: consentLogRes.data || [],
  };

  // Log l'export pour audit trail (preuve de l'exercice du droit RGPD).
  // On attend l'insert avant de renvoyer pour éviter que le runtime serverless
  // termine la fonction avant que l'écriture soit committée. L'overhead est
  // négligeable (~30 ms) face à la sécurité légale.
  const { error: auditErr } = await admin.from("audit_log").insert({
    actor_id: user.id,
    actor_email: userEmail,
    action: "gdpr_export_completed",
    entity_type: "user",
    entity_id: user.id,
    after: { email: userEmail, generated_at: payload.export_metadata.generated_at },
  });
  if (auditErr) console.error("[rgpd/export] audit insert failed:", auditErr.message);

  const filename = `export-emeline-siron-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
