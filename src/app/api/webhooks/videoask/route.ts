import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";

/**
 * Webhook VideoAsk : réception des réponses au quiz "Es-tu fait pour l'investissement locatif".
 *
 * Flow :
 * 1. VideoAsk POST le payload vers cet endpoint quand un répondant termine le quiz
 * 2. On extrait email + réponses + score
 * 3. On upsert le contact (avec tag lm:quiz-investissement + quiz-score:X-Y)
 * 4. On enregistre la réponse détaillée dans quiz_responses
 * 5. L'auto-enroll déclenche la bonne séquence SEQ_QZ_LOW / _MID / _HIGH selon le score
 *
 * Auth : header X-VideoAsk-Secret (valeur dans env VIDEOASK_WEBHOOK_SECRET).
 * Si le secret ne matche pas, on log et on retourne 401 sans détail.
 */

// Protection contre les payloads VideoAsk malformés ou mal configurés.
// VideoAsk envoie typiquement : { interaction_id, form_id, contact: { email, name, phone_number, variables }, answers: [...] }
interface VideoAskPayload {
  interaction_id?: string;
  form_id?: string;
  contact?: {
    email?: string;
    name?: string;
    phone_number?: string;
    variables?: Record<string, string>;
  };
  answers?: Array<{
    question_id?: string;
    answer?: { text?: string; choice_id?: string; value?: string };
  }>;
  // Alternative : certains webhooks envoient directement un tableau à plat
  email?: string;
  score?: number;
}

/**
 * Calcule le score (0-10) à partir des réponses VideoAsk.
 * Le mapping question_id → points par choix est à configurer selon le quiz réel.
 * Pour l'instant, on accepte un score pré-calculé dans le payload si présent,
 * sinon on compte les choix positifs.
 *
 * TODO : mapper les 9 questions du quiz Rentier rebrandé avec leurs barèmes.
 */
function computeScore(payload: VideoAskPayload): number {
  if (typeof payload.score === "number") return Math.max(0, Math.min(10, payload.score));
  // Fallback : si pas de score explicite, on compte les réponses présentes
  // (sera affiné quand Emeline aura le mapping question_id → points)
  const n = payload.answers?.length || 0;
  return Math.min(10, n);
}

function scoreToCategory(score: number): string {
  if (score <= 4) return "tu_perds_argent";
  if (score <= 8) return "operation_blanche";
  return "autofinancement_positif";
}

function scoreToBucketTag(score: number): string {
  if (score <= 4) return "quiz-score:0-4";
  if (score <= 8) return "quiz-score:5-8";
  return "quiz-score:9-10";
}

export async function POST(request: Request) {
  // 1. Vérif du secret (protection contre spam)
  const expectedSecret = process.env.VIDEOASK_WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret = request.headers.get("x-videoask-secret") || request.headers.get("x-webhook-secret");
    if (providedSecret !== expectedSecret) {
      console.warn("[videoask] secret mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: VideoAskPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide" }, { status: 400 });
  }

  // 2. Extraire email (fallback sur contact.variables.email si custom field)
  const email = (
    payload.email ||
    payload.contact?.email ||
    payload.contact?.variables?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn("[videoask] email absent ou invalide :", email);
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const firstName = payload.contact?.name?.split(" ")[0] || payload.contact?.variables?.first_name || "";
  const lastName = payload.contact?.name?.split(" ").slice(1).join(" ") || payload.contact?.variables?.last_name || "";
  const phone = payload.contact?.phone_number || payload.contact?.variables?.phone || null;

  const score = computeScore(payload);
  const category = scoreToCategory(score);
  const scoreTag = scoreToBucketTag(score);

  const supabase = await createServiceClient();

  // 3. Upsert atomique via RPC (merge tags + status RGPD + retour previous_tags
  //    pour calculer les newly added sans race entre webhooks concurrents).
  const tagsToApply = ["lm:quiz-investissement", scoreTag, "rgpd:consent-explicit"];
  const { data: rpcResult, error: upsertErr } = await supabase
    .rpc("upsert_contact_with_tags", {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_add_tags: tagsToApply,
      p_source: "quiz-investisseur",
    });

  if (upsertErr || !rpcResult || rpcResult.length === 0) {
    console.error("[videoask] upsert RPC error:", upsertErr);
    return NextResponse.json({ error: "Erreur upsert contact" }, { status: 500 });
  }

  const contactId = rpcResult[0].id as string;
  const previousTags = (rpcResult[0].previous_tags || []) as string[];

  // La RPC ne gère pas phone, on l'overwrite si fourni.
  if (phone) {
    await supabase.from("contacts").update({ phone }).eq("id", contactId);
  }
  // Pour rester compatible avec le reste du handler qui utilise `contact.id`.
  const contact = { id: contactId };

  // 4. Enregistrer la réponse dans quiz_responses
  await supabase.from("quiz_responses").insert({
    contact_id: contact.id,
    quiz_slug: "quiz-investissement-locatif",
    answers: (payload.answers as unknown) || {},
    score,
    result_category: category,
    completed_at: new Date().toISOString(),
    videoask_response_id: payload.interaction_id || null,
  });

  // 5. Log consent explicit
  await supabase.from("consent_log").insert({
    contact_id: contact.id,
    consent_type: "explicit",
    consent_basis: "quiz_investissement_videoask",
    consent_proof: {
      source: "videoask",
      interaction_id: payload.interaction_id || null,
      form_id: payload.form_id || null,
      ip: request.headers.get("x-forwarded-for") || null,
    },
  });

  // 6. Auto-enroll dans la bonne séquence SEQ_QZ_LOW / _MID / _HIGH
  // (l'auto-enroll ne se déclenche que pour les tags *nouvellement* ajoutés,
  // diff calculée à partir du previous_tags retourné atomiquement par la RPC).
  const newlyAdded = tagsToApply.filter((t) => !previousTags.includes(t));
  if (newlyAdded.length > 0) {
    await autoEnrollByTags(supabase, contact.id, newlyAdded);
  }

  // 7. Event pour tracking behavioral ultérieur
  await supabase.from("contact_events").insert({
    contact_id: contact.id,
    event_type: "quiz_completed",
    metadata: { score, category, source: "videoask" },
  });

  return NextResponse.json({
    success: true,
    contact_id: contact.id,
    score,
    category,
    redirect_to: `/quiz-investisseur/resultat?score=${score}&cat=${category}`,
  });
}

// Certains clients webhook font un GET de test pour valider l'URL
export async function GET() {
  return NextResponse.json({ status: "webhook ready", endpoint: "videoask" });
}
