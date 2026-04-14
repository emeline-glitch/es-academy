"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const evaluationQuestions = [
  {
    question: "Quel est le principal avantage de l'effet de levier en immobilier ?",
    choices: ["Payer moins d'impôts", "Acheter à crédit pour se constituer un patrimoine", "Obtenir des réductions chez le notaire", "Négocier le prix du bien"],
    correct: 1,
  },
  {
    question: "Que signifie l'autofinancement d'un bien locatif ?",
    choices: ["Le bien est payé comptant", "Les loyers couvrent la mensualité de crédit et les charges", "Le vendeur finance l'achat", "L'État subventionne l'achat"],
    correct: 1,
  },
  {
    question: "Quel statut fiscal permet d'amortir un bien meublé ?",
    choices: ["SCI à l'IR", "Micro-foncier", "LMNP au réel", "Déficit foncier"],
    correct: 2,
  },
  {
    question: "Quel document est indispensable pour une demande de crédit immobilier ?",
    choices: ["Le bail du locataire", "Le business plan de l'opération", "Le certificat de naissance", "Le permis de construire"],
    correct: 1,
  },
  {
    question: "Qu'est-ce qu'un différé bancaire ?",
    choices: ["Un délai avant de commencer à rembourser le crédit", "Un taux d'intérêt variable", "Une assurance emprunteur", "Un frais de dossier"],
    correct: 0,
  },
  {
    question: "Quel est le taux d'endettement maximum généralement accepté par les banques ?",
    choices: ["25%", "33%", "35%", "50%"],
    correct: 2,
  },
  {
    question: "Quelle est la durée légale du droit de rétractation après signature d'un compromis ?",
    choices: ["7 jours", "10 jours", "14 jours", "30 jours"],
    correct: 1,
  },
  {
    question: "Quel type de location offre généralement le meilleur rendement ?",
    choices: ["Location nue longue durée", "Location meublée / colocation", "Location à un proche", "Location de parking"],
    correct: 1,
  },
  {
    question: "Qu'est-ce qu'une SCI ?",
    choices: ["Une Société Commerciale Immobilière", "Une Société Civile Immobilière", "Un Statut de Contribuable Immobilier", "Une Société de Crédit Immobilier"],
    correct: 1,
  },
  {
    question: "Quel est le premier réflexe avant de visiter un bien ?",
    choices: ["Appeler le notaire", "Calculer la rentabilité prévisionnelle", "Signer un mandat", "Demander un crédit"],
    correct: 1,
  },
];

export default function EvaluationPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showDiploma, setShowDiploma] = useState(false);

  function selectAnswer(qi: number, ci: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: ci }));
  }

  function handleSubmit() {
    const correct = evaluationQuestions.reduce((count, q, i) => {
      return count + (answers[i] === q.correct ? 1 : 0);
    }, 0);
    const pct = Math.round((correct / evaluationQuestions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    // Save result
    fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: "evaluation-finale",
        lesson_id: "evaluation-finale",
        score: pct,
        answers,
        passed: pct >= 70,
      }),
    });
  }

  function handleReset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowDiploma(false);
  }

  const passed = score >= 70;
  const allAnswered = Object.keys(answers).length === evaluationQuestions.length;

  if (showDiploma) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-4 border-es-green rounded-2xl p-12 text-center shadow-xl" id="diploma">
          <div className="border-2 border-es-gold/30 rounded-xl p-10">
            <div className="text-es-gold text-5xl mb-4">🏆</div>
            <h1 className="font-serif text-3xl font-bold text-es-green mb-2">Certificat de Réussite</h1>
            <p className="text-gray-400 text-sm mb-8">ES Academy — La Méthode Emeline Siron</p>

            <div className="my-8">
              <p className="text-gray-500 text-sm">Ce certificat atteste que</p>
              <p className="font-serif text-2xl font-bold text-es-text my-3">— Votre nom —</p>
              <p className="text-gray-500 text-sm">a complété avec succès la formation</p>
              <p className="font-serif text-lg font-bold text-es-green mt-2">La Méthode Emeline Siron</p>
              <p className="text-gray-500 text-sm mt-1">14 modules · 30h de formation · Évaluation finale : {score}%</p>
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

        <div className="flex gap-3 justify-center mt-6">
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Évaluation finale</h1>
        <p className="text-gray-500 mt-1">
          10 questions pour valider vos acquis. Score minimum : 70%.
        </p>
      </div>

      {submitted ? (
        <Card className="text-center py-12">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? "bg-green-100" : "bg-red-100"}`}>
            <span className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {score}%
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            {passed ? "Félicitations ! 🎉" : "Pas tout à fait..."}
          </h2>
          <p className="text-gray-500 mb-6">
            {passed
              ? `Vous avez réussi l'évaluation avec ${score}% de bonnes réponses.`
              : `Il faut 70% pour valider. Vous avez obtenu ${score}%. Révisez et réessayez !`}
          </p>
          {passed ? (
            <Button variant="primary" size="lg" onClick={() => setShowDiploma(true)}>
              Obtenir mon diplôme 🏆
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleReset}>
              Réessayer
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {evaluationQuestions.map((q, qi) => (
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
            disabled={!allAnswered}
          >
            {allAnswered
              ? "Valider mon évaluation"
              : `${Object.keys(answers).length}/${evaluationQuestions.length} questions répondues`}
          </Button>
        </div>
      )}
    </div>
  );
}
