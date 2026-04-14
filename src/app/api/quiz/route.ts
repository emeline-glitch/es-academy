import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
