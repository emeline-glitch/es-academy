import { createServiceClient } from "@/lib/supabase/server";

export interface QuizOption {
  id: string;
  text: string;
  // is_correct n'est PAS exposé côté front : la validation passe par /api/quiz/submit.
}

export interface QuizQuestion {
  id: string;
  code: string;
  text: string;
  type: "single_select" | "multi_select";
  options: QuizOption[];
}

export interface Quiz {
  lessonCode: string;
  moduleCode: string;
  questions: QuizQuestion[];
}

// Construit le lesson_code (M1-LA, M2-LC, ...) à partir des ordres Notion.
// module.order = 1..14, lesson.order = 1..N → lettre A..Z.
export function buildLessonCode(moduleOrder: number, lessonOrder: number): string {
  const letter = String.fromCharCode(64 + lessonOrder); // 1→A, 2→B, ...
  return `M${moduleOrder}-L${letter}`;
}

export async function getQuizByLessonCode(lessonCode: string): Promise<Quiz | null> {
  const supabase = await createServiceClient();

  const { data: questions, error } = await supabase
    .from("quiz_questions")
    .select("id, question_code, lesson_code, module_code, question_text, question_type, sort_order, quiz_options(id, option_text, sort_order)")
    .eq("lesson_code", lessonCode)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getQuizByLessonCode error:", error.message);
    return null;
  }
  if (!questions || questions.length === 0) return null;

  return {
    lessonCode,
    moduleCode: questions[0].module_code,
    questions: questions.map((q) => ({
      id: q.id,
      code: q.question_code,
      text: q.question_text,
      type: q.question_type as "single_select" | "multi_select",
      options: ((q.quiz_options as Array<{ id: string; option_text: string; sort_order: number }>) || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ id: o.id, text: o.option_text })),
    })),
  };
}

// Côté serveur uniquement : récupère les bonnes réponses pour scorer.
export async function getCorrectAnswers(questionIds: string[]): Promise<Map<string, Set<string>>> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("quiz_options")
    .select("question_id, id, is_correct")
    .in("question_id", questionIds)
    .eq("is_correct", true);
  if (error) throw error;
  const map = new Map<string, Set<string>>();
  for (const row of data || []) {
    if (!map.has(row.question_id)) map.set(row.question_id, new Set());
    map.get(row.question_id)!.add(row.id);
  }
  return map;
}
