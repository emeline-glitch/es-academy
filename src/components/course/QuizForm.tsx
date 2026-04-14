"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
}

interface QuizFormProps {
  quizId: string;
  lessonId: string;
  questions: QuizQuestion[];
  passScore: number;
}

export function QuizForm({ quizId, lessonId, questions, passScore }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  function selectAnswer(questionIndex: number, choiceIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: choiceIndex }));
  }

  async function handleSubmit() {
    const correct = questions.reduce((count, q, i) => {
      return count + (answers[i] === q.correctIndex ? 1 : 0);
    }, 0);

    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    // Save result
    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          lesson_id: lessonId,
          score: pct,
          answers,
          passed: pct >= passScore,
        }),
      });
    } catch {
      // Silent fail
    }
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }

  const passed = score >= passScore;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-serif text-lg font-bold text-gray-900 mb-6">
        Quiz — Teste tes connaissances
      </h3>

      {submitted ? (
        <div className="text-center py-8">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              passed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <span className={`text-2xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {score}%
            </span>
          </div>
          <h4 className="font-serif text-xl font-bold text-gray-900 mb-2">
            {passed ? "Bravo !" : "Pas tout a fait..."}
          </h4>
          <p className="text-gray-500 mb-6">
            {passed
              ? `Tu as reussi le quiz avec ${score}% de bonnes reponses.`
              : `Il te faut ${passScore}% pour valider. Tu as obtenu ${score}%. Reessaie !`}
          </p>
          {!passed && (
            <Button onClick={reset} variant="secondary">
              Reessayer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="font-medium text-gray-900 mb-3">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.choices.map((choice, ci) => (
                  <button
                    key={ci}
                    onClick={() => selectAnswer(qi, ci)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                      answers[qi] === ci
                        ? "border-es-green bg-es-green/5 text-es-green font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!allAnswered}
          >
            Valider mes reponses
          </Button>
        </div>
      )}
    </div>
  );
}
