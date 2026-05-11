import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCorrectAnswers, getQuizByLessonCode } from "@/lib/supabase/quiz";

interface SubmittedAnswer {
  questionId: string;
  optionIds: string[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.lessonCode !== "string" || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }
  const lessonCode: string = body.lessonCode;
  const submitted: SubmittedAnswer[] = body.answers;

  const quiz = await getQuizByLessonCode(lessonCode);
  if (!quiz) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });

  // Validation : toutes les questions du quiz doivent avoir une réponse soumise.
  const expectedIds = new Set(quiz.questions.map((q) => q.id));
  const submittedById = new Map(submitted.map((a) => [a.questionId, new Set(a.optionIds)]));
  for (const qid of expectedIds) {
    if (!submittedById.has(qid)) {
      return NextResponse.json({ error: "Toutes les questions doivent être répondues" }, { status: 400 });
    }
  }

  const questionIds = Array.from(expectedIds);
  const correctByQ = await getCorrectAnswers(questionIds);

  let score = 0;
  const perQuestion = quiz.questions.map((q) => {
    const userSet = submittedById.get(q.id) || new Set<string>();
    const correctSet = correctByQ.get(q.id) || new Set<string>();
    // Égalité ensembliste : même cardinalité + tout présent.
    let isCorrect = userSet.size === correctSet.size;
    if (isCorrect) {
      for (const id of userSet) if (!correctSet.has(id)) { isCorrect = false; break; }
    }
    if (isCorrect) score++;
    return {
      questionId: q.id,
      correctOptionIds: Array.from(correctSet),
      userOptionIds: Array.from(userSet),
      isCorrect,
    };
  });

  const total = quiz.questions.length;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 70;

  // Persist (upsert sur user_id + quiz_id). On utilise lessonCode comme quiz_id pour l'unicité.
  const adminDb = await createServiceClient();
  const { error: persistErr } = await adminDb.from("quiz_results").upsert(
    {
      user_id: user.id,
      quiz_id: lessonCode,
      lesson_id: lessonCode,
      score: percentage,
      answers: submitted,
      passed,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,quiz_id" }
  );
  if (persistErr) {
    console.error("quiz_results upsert error:", persistErr.message);
  }

  return NextResponse.json({ score, total, percentage, passed, perQuestion });
}
