-- 045_quiz_questions.sql
-- Quiz formation ES Academy : 117 questions / ~350 options sur 58 leçons (14 modules)
-- Leçons stockées en Notion → on indexe par lesson_code texte (M1-LA, M1-LB, etc.)

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code TEXT NOT NULL UNIQUE,       -- M1-LA-Q01
  lesson_code TEXT NOT NULL,                -- M1-LA
  module_code TEXT NOT NULL,                -- M1
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_select','multi_select')),
  sort_order INTEGER NOT NULL DEFAULT 1,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_questions_lesson_idx ON public.quiz_questions(lesson_code);
CREATE INDEX IF NOT EXISTS quiz_questions_module_idx ON public.quiz_questions(module_code);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_options_question_idx ON public.quiz_options(question_id);

-- RLS : lecture publique pour les élèves inscrits (la gate d'inscription est faite côté layout),
-- on expose le contenu des quiz (sans révéler is_correct côté front : la validation passe par l'API).
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options   ENABLE ROW LEVEL SECURITY;

-- Lecture authentifiée (le serveur Next côté API utilise le service role pour scorer).
DROP POLICY IF EXISTS "quiz_questions_read_auth" ON public.quiz_questions;
CREATE POLICY "quiz_questions_read_auth"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (published = true);

DROP POLICY IF EXISTS "quiz_options_read_auth" ON public.quiz_options;
CREATE POLICY "quiz_options_read_auth"
  ON public.quiz_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      WHERE q.id = quiz_options.question_id AND q.published = true
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_quiz_questions_updated_at();
