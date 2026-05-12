import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  EVALUATION_PASS_PERCENTAGE,
  EVALUATION_TOTAL_QUESTIONS,
  getEvaluationCorrectAnswers,
} from "@/lib/evaluation/data";

/**
 * POST /api/evaluation/submit
 *
 * Examen final ES Academy : scoring server-side strict.
 *
 * Body : { answers: Record<string|number, number> }
 *   answers[i] = index du choix selectionne (0..3) pour la question i
 *   Toutes les questions doivent etre repondues.
 *
 * Securite (cf src/lib/evaluation/data.ts) :
 *  - Les bonnes reponses sont en code server-only, jamais expose au client
 *  - Le calcul du score se fait ici, le client ne fait que collecter les choix
 *  - Idempotence : si l'examen est deja "passed", on retourne le resultat existant
 *    sans re-ecrire (empeche reset cote DB via spam de submits)
 *
 * Persist dans quiz_results (table existante, RLS user_id = auth.uid()).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const answers = body?.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  // Validation stricte : chaque question 0..N-1 doit avoir un index 0..3 (integer)
  const correctList = getEvaluationCorrectAnswers();
  const userChoices: number[] = new Array(EVALUATION_TOTAL_QUESTIONS);
  for (let i = 0; i < EVALUATION_TOTAL_QUESTIONS; i++) {
    const raw = (answers as Record<string, unknown>)[i] ?? (answers as Record<string, unknown>)[String(i)];
    if (
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw < 0 ||
      raw > 3
    ) {
      return NextResponse.json(
        { error: `Réponse invalide ou manquante pour la question ${i + 1}` },
        { status: 400 }
      );
    }
    userChoices[i] = raw;
  }

  const adminDb = await createServiceClient();

  // Idempotence : si deja passed, on retourne sans rien re-ecrire.
  // Sinon, ca permettrait de "reset" l'examen en spammant des mauvaises
  // reponses, et de faire chuter le score precedemment valide.
  const { data: existing } = await adminDb
    .from("quiz_results")
    .select("score, passed, completed_at")
    .eq("user_id", user.id)
    .eq("quiz_id", "examen-final")
    .maybeSingle();

  if (existing?.passed) {
    return NextResponse.json({
      percentage: existing.score,
      passed: true,
      already_validated: true,
      completed_at: existing.completed_at,
      total: EVALUATION_TOTAL_QUESTIONS,
    });
  }

  // Calcul du score cote serveur
  let correctCount = 0;
  for (let i = 0; i < EVALUATION_TOTAL_QUESTIONS; i++) {
    if (userChoices[i] === correctList[i]) correctCount++;
  }
  const percentage = Math.round((correctCount / EVALUATION_TOTAL_QUESTIONS) * 100);
  const passed = percentage >= EVALUATION_PASS_PERCENTAGE;

  // Persist : on enregistre le resultat. Si !passed, on garde la trace de la
  // derniere tentative mais on n'ecrit pas completed_at (reserve aux passed).
  const persistRow = {
    user_id: user.id,
    quiz_id: "examen-final",
    lesson_id: "examen-final",
    score: percentage,
    answers: userChoices, // les indices choisis, pas les correct
    passed,
    completed_at: passed ? new Date().toISOString() : null,
  };

  const { error: persistErr } = await adminDb
    .from("quiz_results")
    .upsert(persistRow, { onConflict: "user_id,quiz_id" });

  if (persistErr) {
    console.error("[evaluation/submit] persist error:", persistErr.message);
    return NextResponse.json(
      { error: "Erreur enregistrement résultat" },
      { status: 500 }
    );
  }

  // Audit log si succes (preuve pour delivrance diplome).
  if (passed) {
    try {
      await adminDb.from("audit_log").insert({
        action: "evaluation_passed",
        entity_type: "quiz_results",
        entity_id: user.id,
        after: {
          quiz_id: "examen-final",
          score: percentage,
          correct: correctCount,
          total: EVALUATION_TOTAL_QUESTIONS,
        },
      });
    } catch {
      // best-effort
    }
  }

  // On ne renvoie PAS les bonnes reponses (sinon brute-force trivial).
  // Le client recevra seulement le score global + flag passed.
  return NextResponse.json({
    percentage,
    passed,
    correct_count: correctCount,
    total: EVALUATION_TOTAL_QUESTIONS,
    pass_threshold: EVALUATION_PASS_PERCENTAGE,
  });
}

/**
 * GET /api/evaluation/submit
 *
 * Recupere le resultat actuel de l'examen pour l'eleve courant (status check
 * a l'ouverture de /evaluation). Remplace l'ancien GET /api/quiz?quiz_id=
 * pour ce cas specifique.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data } = await supabase
    .from("quiz_results")
    .select("score, passed, completed_at")
    .eq("user_id", user.id)
    .eq("quiz_id", "examen-final")
    .maybeSingle();

  return NextResponse.json({
    result: data || null,
    total: EVALUATION_TOTAL_QUESTIONS,
    pass_threshold: EVALUATION_PASS_PERCENTAGE,
  });
}
