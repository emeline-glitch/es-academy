import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Pour l'examen final, on exige la réponse à toutes les questions
const MIN_ANSWERS: Record<string, number> = { "examen-final": 30 };

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const quizId = new URL(request.url).searchParams.get("quiz_id");
  if (!quizId) {
    return NextResponse.json({ error: "quiz_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quiz_results")
    .select("score, passed, completed_at, answers")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const { quiz_id, lesson_id, score, answers, passed } = body;

  if (!quiz_id || !lesson_id || score === undefined) {
    return NextResponse.json({ error: "quiz_id, lesson_id et score requis" }, { status: 400 });
  }

  // Garde-fou : pour l'examen final, on exige l'intégralité des réponses
  const requiredAnswers = MIN_ANSWERS[quiz_id];
  if (requiredAnswers && (!answers || Object.keys(answers).length < requiredAnswers)) {
    return NextResponse.json(
      { error: `Examen incomplet (${Object.keys(answers || {}).length}/${requiredAnswers} questions)` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("quiz_results").upsert(
    {
      user_id: user.id,
      quiz_id,
      lesson_id,
      score,
      answers,
      passed,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,quiz_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
