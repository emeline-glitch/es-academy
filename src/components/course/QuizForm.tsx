"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface QuizFormOption {
  id: string;
  text: string;
}
export interface QuizFormQuestion {
  id: string;
  code: string;
  text: string;
  type: "single_select" | "multi_select";
  options: QuizFormOption[];
}

interface QuizFormProps {
  lessonCode: string;
  questions: QuizFormQuestion[];
  passScore?: number; // 0-100, défaut 70
}

interface SubmitResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  perQuestion: Array<{ questionId: string; correctOptionIds: string[]; userOptionIds: string[]; isCorrect: boolean }>;
}

export function QuizForm({ lessonCode, questions, passScore = 70 }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleAnswer(questionId: string, optionId: string, type: "single_select" | "multi_select") {
    if (submitted) return;
    setAnswers((prev) => {
      const current = new Set(prev[questionId] || []);
      if (type === "single_select") {
        current.clear();
        current.add(optionId);
      } else {
        if (current.has(optionId)) current.delete(optionId);
        else current.add(optionId);
      }
      return { ...prev, [questionId]: current };
    });
  }

  async function handleSubmit() {
    setLoading(true);
    const payload = {
      lessonCode,
      answers: questions.map((q) => ({
        questionId: q.id,
        optionIds: Array.from(answers[q.id] || []),
      })),
    };
    try {
      const r = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("submit failed");
      const data: SubmitResult = await r.json();
      setResult(data);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert("Impossible d'envoyer tes réponses, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  const allAnswered = questions.every((q) => (answers[q.id]?.size ?? 0) > 0);
  const passed = result ? result.passed : false;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg font-bold text-gray-900">
          Quiz : teste tes connaissances
        </h3>
        <span className="text-xs text-gray-400">
          {questions.length} question{questions.length > 1 ? "s" : ""}
        </span>
      </div>

      {submitted && result ? (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                passed ? "bg-es-green/10" : "bg-red-100"
              }`}
            >
              <span className={`text-2xl font-bold ${passed ? "text-es-green" : "text-red-600"}`}>
                {result.percentage}%
              </span>
            </div>
            <h4 className="font-serif text-xl font-bold text-gray-900 mb-2">
              {passed ? "Bravo !" : "Pas tout à fait..."}
            </h4>
            <p className="text-gray-500">
              {result.score} / {result.total} bonnes réponses
              {!passed && ` (${passScore}% pour valider)`}
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const perQ = result.perQuestion.find((p) => p.questionId === q.id);
              if (!perQ) return null;
              const correctSet = new Set(perQ.correctOptionIds);
              const userSet = new Set(perQ.userOptionIds);
              return (
                <div key={q.id} className="border-t border-gray-100 pt-4">
                  <p className="font-medium text-gray-900 mb-3 flex items-start gap-2">
                    <span className={`mt-0.5 inline-block w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${
                      perQ.isCorrect ? "bg-es-green text-white" : "bg-red-100 text-red-600"
                    }`}>
                      {perQ.isCorrect ? "✓" : "✗"}
                    </span>
                    <span>{q.text}</span>
                  </p>
                  <div className="space-y-1.5 ml-7">
                    {q.options.map((o) => {
                      const isCorrect = correctSet.has(o.id);
                      const isUser = userSet.has(o.id);
                      return (
                        <div
                          key={o.id}
                          className={`px-3 py-2 rounded-lg text-sm border ${
                            isCorrect
                              ? "border-es-green bg-es-green/5 text-es-green"
                              : isUser
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-gray-100 text-gray-500"
                          }`}
                        >
                          {isCorrect ? "✓ " : isUser ? "✗ " : "○ "}
                          {o.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!passed && (
            <Button onClick={reset} variant="secondary" className="w-full">
              Réessayer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={q.id}>
              <p className="font-medium text-gray-900 mb-1">
                {qi + 1}. {q.text}
              </p>
              {q.type === "multi_select" && (
                <p className="text-xs text-gray-400 mb-3">Plusieurs bonnes réponses possibles</p>
              )}
              <div className="space-y-2 mt-2">
                {q.options.map((o) => {
                  const selected = answers[q.id]?.has(o.id) ?? false;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleAnswer(q.id, o.id, q.type)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        selected
                          ? "border-es-green bg-es-green/5 text-es-green font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <span className={`w-5 h-5 ${q.type === "multi_select" ? "rounded" : "rounded-full"} border-2 flex-shrink-0 flex items-center justify-center ${
                        selected ? "border-es-green bg-es-green" : "border-gray-300"
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span>{o.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!allAnswered || loading}
          >
            {loading ? "Validation..." : "Valider mes réponses"}
          </Button>
        </div>
      )}
    </div>
  );
}
