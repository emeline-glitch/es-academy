"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PublicQuestion {
  question: string;
  choices: string[];
}

interface Props {
  questions: PublicQuestion[];
  totalQuestions: number;
  passThreshold: number;
}

interface InitialResult {
  score: number;
  passed: boolean;
  completed_at: string | null;
}

/**
 * UI examen final. Recoit les questions cote serveur (sans le champ `correct`).
 * Le scoring se fait integralement cote serveur via /api/evaluation/submit.
 *
 * Avant : le calcul du score se faisait cote client en comparant les choix
 * avec un champ `correct` exposed dans le bundle JS = bypass DevTools trivial.
 * Maintenant : le client envoie juste les indices choisis, le serveur retourne
 * le pourcentage et un boolean passed.
 */
export function EvaluationClient({ questions, totalQuestions, passThreshold }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showDiploma, setShowDiploma] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyValidated, setAlreadyValidated] = useState(false);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Au mount : check si l'examen a déjà ete passe
  useEffect(() => {
    let cancelled = false;
    fetch("/api/evaluation/submit")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const result: InitialResult | null = data?.result || null;
        if (result?.passed) {
          setScore(result.score);
          setSubmitted(true);
          setAlreadyValidated(true);
          setValidatedAt(result.completed_at || null);
        }
      })
      .catch(() => {
        // si fetch fail (offline), on continue, l'eleve pourra tenter
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectAnswer(qi: number, ci: number) {
    if (submitted || submitting) return;
    setAnswers((prev) => ({ ...prev, [qi]: ci }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error || "Erreur lors de la soumission");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setScore(data.percentage);
      setSubmitted(true);
      if (data.passed) {
        setAlreadyValidated(true);
        setValidatedAt(data.completed_at || new Date().toISOString());
      }
    } catch {
      setSubmitError("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    if (alreadyValidated) return;
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowDiploma(false);
    setSubmitError(null);
  }

  const passed = score >= passThreshold;
  const allAnswered = Object.keys(answers).length === totalQuestions;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
          <p className="text-sm text-gray-500">Chargement de ton examen…</p>
        </div>
      </div>
    );
  }

  if (showDiploma) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-4 border-es-green rounded-2xl p-12 text-center shadow-xl print:shadow-none print:border-2" id="diploma">
          <div className="border-2 border-es-gold/30 rounded-xl p-10">
            <div className="text-es-gold text-5xl mb-4">🏆</div>
            <h1 className="font-serif text-3xl font-bold text-es-green mb-2">Certificat de Réussite</h1>
            <p className="text-gray-400 text-sm mb-8">ES Academy : La Méthode Emeline Siron</p>

            <div className="my-8">
              <p className="text-gray-500 text-sm">Ce certificat atteste que</p>
              <div className="my-3 print:my-3">
                <input
                  type="text"
                  placeholder="Ton nom complet"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  aria-label="Nom du participant"
                  className="font-serif text-2xl font-bold text-es-text text-center outline-none pb-1 w-full max-w-md mx-auto bg-transparent border-b-2 border-es-gold/20 hover:border-es-gold/50 focus:border-es-gold transition-colors print:border-none"
                />
                {!userName && (
                  <p className="text-[11px] text-gray-400 italic mt-2 print:hidden">Clique ici pour saisir ton nom</p>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-4">a complété avec succès la formation</p>
              <p className="font-serif text-lg font-bold text-es-green mt-2">La Méthode Emeline Siron</p>
              <p className="font-serif text-base text-es-green/80 mt-1">Investissement immobilier locatif</p>
              <p className="text-gray-500 text-xs mt-3 max-w-sm mx-auto leading-relaxed">
                Stratégie d&apos;investissement, fiscalité, financement, recherche de biens,
                négociation, gestion locative et structuration patrimoniale
              </p>
              <p className="text-gray-400 text-xs mt-3">14 modules · 30h de formation · Examen final : {score}%</p>
            </div>

            <div className="flex items-center justify-center gap-8 mt-10 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="font-serif text-sm font-bold text-es-text">Emeline Siron</p>
                <p className="text-[10px] text-gray-400">Formatrice</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-sm font-bold text-es-text">{new Date().toLocaleDateString("fr-FR")}</p>
                <p className="text-[10px] text-gray-400">Date de délivrance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-6 print:hidden">
          <Button variant="primary" onClick={() => window.print()}>
            Imprimer / PDF
          </Button>
          <Button variant="secondary" href="/dashboard">
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl mx-auto"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Examen final</h1>
        <p className="text-gray-500 mt-1">
          {totalQuestions} questions pour valider tes acquis sur l&apos;ensemble de la formation. Score minimum : {passThreshold}%.
        </p>
      </div>

      {submitted ? (
        <Card className="text-center py-12">
          {alreadyValidated && (
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
              <span>✅</span>
              <span>Examen validé</span>
            </div>
          )}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? "bg-green-100" : "bg-red-100"}`}>
            <span className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {score}%
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            {passed ? "Félicitations ! 🎉" : "Pas tout à fait..."}
          </h2>
          <p className="text-gray-500 mb-2">
            {passed
              ? `Tu as réussi l'examen final avec ${score}% de bonnes réponses.`
              : `Il faut ${passThreshold}% pour valider. Tu as obtenu ${score}%. Révise et réessaie !`}
          </p>
          {alreadyValidated && validatedAt && (
            <p className="text-xs text-gray-400 mb-6">
              Validé le {new Date(validatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {!alreadyValidated && <div className="mb-6" />}

          {passed ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="lg" onClick={() => setShowDiploma(true)}>
                {alreadyValidated ? "Télécharger mon diplôme 🏆" : "Obtenir mon diplôme 🏆"}
              </Button>
              {alreadyValidated && (
                <Button variant="secondary" size="lg" href="/dashboard">
                  Retour au dashboard
                </Button>
              )}
            </div>
          ) : (
            <Button variant="secondary" onClick={handleReset}>
              Réessayer
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {submitError && (
            <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4">
              {submitError}
            </div>
          )}

          {questions.map((q, qi) => (
            <Card key={qi}>
              <p className="font-medium text-gray-900 mb-4">
                <span className="text-es-green font-bold mr-2">{qi + 1}.</span>
                {q.question}
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
            </Card>
          ))}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting
              ? "Envoi…"
              : allAnswered
              ? "Valider mon examen"
              : `${Object.keys(answers).length}/${totalQuestions} questions répondues`}
          </Button>
        </div>
      )}
    </div>
  );
}
