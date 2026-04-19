"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const evaluationQuestions = [
  // Module 1 — Mindset & fondamentaux
  { question: "Quel est le principal avantage de l'effet de levier en immobilier ?", choices: ["Payer moins d'impôts", "Acheter à crédit pour se constituer un patrimoine", "Obtenir des réductions chez le notaire", "Négocier le prix du bien"], correct: 1 },
  { question: "Que signifie l'autofinancement d'un bien locatif ?", choices: ["Le bien est payé comptant", "Les loyers couvrent la mensualité de crédit et les charges", "Le vendeur finance l'achat", "L'État subventionne l'achat"], correct: 1 },
  { question: "Pourquoi est-il important de définir sa stratégie avant d'investir ?", choices: ["Pour impressionner le banquier", "Pour savoir quel type de bien chercher et quel rendement viser", "Pour obtenir un meilleur taux", "Ce n'est pas nécessaire"], correct: 1 },
  // Module 2 — Fiscalité
  { question: "Quel statut fiscal permet d'amortir un bien meublé ?", choices: ["SCI à l'IR", "Micro-foncier", "LMNP au réel", "Déficit foncier"], correct: 2 },
  { question: "Quelle est la différence entre le micro-BIC et le régime réel en LMNP ?", choices: ["Le micro-BIC permet de déduire plus de charges", "Le régime réel permet d'amortir le bien et déduire les charges réelles", "Il n'y a aucune différence", "Le régime réel est réservé aux professionnels"], correct: 1 },
  { question: "Qu'est-ce que le déficit foncier ?", choices: ["Un bénéfice imposable", "Quand les charges déductibles dépassent les revenus fonciers", "Une taxe supplémentaire", "Un avantage réservé aux SCI"], correct: 1 },
  // Module 3 — Financement
  { question: "Quel document est indispensable pour une demande de crédit immobilier ?", choices: ["Le bail du locataire", "Le business plan de l'opération", "Le certificat de naissance", "Le permis de construire"], correct: 1 },
  { question: "Qu'est-ce qu'un différé bancaire ?", choices: ["Un délai avant de commencer à rembourser le crédit", "Un taux d'intérêt variable", "Une assurance emprunteur", "Un frais de dossier"], correct: 0 },
  { question: "Quel est le taux d'endettement maximum généralement accepté par les banques ?", choices: ["25%", "33%", "35%", "50%"], correct: 2 },
  { question: "Pourquoi un apport personnel peut-il aider à obtenir un meilleur taux ?", choices: ["Il prouve au banquier ta capacité d'épargne", "Il est obligatoire", "Il remplace l'assurance emprunteur", "Il n'a aucun impact"], correct: 0 },
  // Module 4 — Recherche de biens
  { question: "Quel est le premier réflexe avant de visiter un bien ?", choices: ["Appeler le notaire", "Calculer la rentabilité prévisionnelle", "Signer un mandat", "Demander un crédit"], correct: 1 },
  { question: "Qu'est-ce qu'une étude de marché locatif ?", choices: ["Un document du notaire", "L'analyse de l'offre et la demande locative dans un secteur", "Un diagnostic immobilier", "Un rapport de l'agent immobilier"], correct: 1 },
  { question: "Quel critère est le plus important pour un investissement locatif ?", choices: ["La beauté du bien", "L'emplacement et la demande locative", "Le nombre de pièces", "L'année de construction"], correct: 1 },
  // Module 5 — Négociation
  { question: "Quel est le meilleur moment pour négocier le prix d'un bien ?", choices: ["Après la signature du compromis", "Dès la première visite en identifiant les défauts", "Jamais, le prix affiché est fixe", "Uniquement si le bien est en vente depuis plus d'un an"], correct: 1 },
  { question: "Quelle est la durée légale du droit de rétractation après signature d'un compromis ?", choices: ["7 jours", "10 jours", "14 jours", "30 jours"], correct: 1 },
  // Module 6 — Types de location
  { question: "Quel type de location offre généralement le meilleur rendement ?", choices: ["Location nue longue durée", "Location meublée / colocation", "Location à un proche", "Location de parking"], correct: 1 },
  { question: "Quelle est la durée minimum d'un bail en location meublée ?", choices: ["6 mois", "1 an", "3 ans", "9 mois pour un étudiant"], correct: 1 },
  { question: "Qu'est-ce que la colocation apporte de plus qu'une location classique ?", choices: ["Moins de gestion", "Un loyer global plus élevé par rapport à la surface", "Aucun avantage", "Moins de fiscalité"], correct: 1 },
  // Module 7 — Travaux & valorisation
  { question: "Pourquoi les travaux sont-ils un levier de rentabilité ?", choices: ["Ils permettent d'augmenter la valeur du bien et le loyer", "Ils sont obligatoires", "Ils diminuent les impôts uniquement", "Ils n'ont aucun impact"], correct: 0 },
  { question: "Qu'est-ce que la division d'un lot immobilier ?", choices: ["Vendre un bien en plusieurs fois", "Transformer un grand logement en plusieurs petits pour augmenter le rendement", "Diviser le crédit en deux", "Séparer le terrain de la maison"], correct: 1 },
  // Module 8 — Gestion locative
  { question: "Quel est l'avantage principal de gérer soi-même ses locations ?", choices: ["Économiser les frais d'agence (6-8% des loyers)", "C'est obligatoire en LMNP", "Ça prend moins de temps", "Le locataire paie mieux"], correct: 0 },
  { question: "Quelle assurance protège contre les loyers impayés ?", choices: ["L'assurance habitation", "La garantie loyers impayés (GLI)", "L'assurance emprunteur", "La RC Pro"], correct: 1 },
  // Module 9 — Structuration patrimoniale
  { question: "Qu'est-ce qu'une SCI ?", choices: ["Une Société Commerciale Immobilière", "Une Société Civile Immobilière", "Un Statut de Contribuable Immobilier", "Une Société de Crédit Immobilier"], correct: 1 },
  { question: "Dans quel cas une SCI à l'IS est-elle intéressante ?", choices: ["Pour habiter le bien", "Pour capitaliser et réinvestir les bénéfices", "Pour payer plus d'impôts", "Jamais, c'est toujours désavantageux"], correct: 1 },
  { question: "Qu'est-ce qu'une holding immobilière ?", choices: ["Un type de crédit", "Une société qui détient des parts dans d'autres sociétés immobilières", "Un impôt sur la fortune", "Un bien de prestige"], correct: 1 },
  // Module 10 — Rentabilité avancée
  { question: "Comment calcule-t-on le rendement brut ?", choices: ["Loyer annuel / prix d'achat × 100", "Loyer mensuel × 12", "Prix d'achat / loyer annuel", "Cash-flow × 12 / prix"], correct: 0 },
  { question: "Quelle est la différence entre rendement brut et rendement net ?", choices: ["Il n'y a aucune différence", "Le net déduit les charges, taxes et vacance locative", "Le brut est toujours plus bas", "Le net inclut la plus-value"], correct: 1 },
  // Module 11 — Plus-value & revente
  { question: "Au bout de combien d'années la plus-value immobilière est-elle exonérée d'impôts (résidence secondaire) ?", choices: ["10 ans", "15 ans", "22 ans pour l'IR, 30 ans pour les prélèvements sociaux", "Jamais"], correct: 2 },
  // Module 12 — Passage à l'action
  { question: "Quel est le risque principal de ne pas passer à l'action ?", choices: ["Perdre de l'argent", "Rater des opportunités et l'effet du temps sur la constitution de patrimoine", "Être pénalisé par les impôts", "Il n'y a aucun risque"], correct: 1 },
  { question: "Quelle est la première étape concrète pour investir ?", choices: ["Acheter un bien immédiatement", "Définir ses objectifs, son budget et commencer les recherches", "Créer une SCI", "Attendre que les prix baissent"], correct: 1 },
];

export default function ExamenFinalPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showDiploma, setShowDiploma] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [alreadyValidated, setAlreadyValidated] = useState(false);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);

  // Au mount : on vérifie si l'examen a déjà été validé
  useEffect(() => {
    let cancelled = false;
    fetch("/api/quiz?quiz_id=examen-final")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const result = data?.result;
        if (result?.passed) {
          setScore(result.score);
          setSubmitted(true);
          setAlreadyValidated(true);
          setValidatedAt(result.completed_at || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

    fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: "examen-final",
        lesson_id: "examen-final",
        score: pct,
        answers,
        passed: pct >= 70,
      }),
    }).then(() => {
      if (pct >= 70) {
        setAlreadyValidated(true);
        setValidatedAt(new Date().toISOString());
      }
    });
  }

  function handleReset() {
    // Un réessai n'est autorisé que si l'examen n'est pas déjà validé
    if (alreadyValidated) return;
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowDiploma(false);
  }

  const passed = score >= 70;
  const allAnswered = Object.keys(answers).length === evaluationQuestions.length;

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
            <p className="text-gray-400 text-sm mb-8">ES Academy — La Méthode Emeline Siron</p>

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
                Stratégie d'investissement, fiscalité, financement, recherche de biens,
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
          30 questions pour valider tes acquis sur l'ensemble de la formation. Score minimum : 70%.
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
              : `Il faut 70% pour valider. Tu as obtenu ${score}%. Révise et réessaie !`}
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
              ? "Valider mon examen"
              : `${Object.keys(answers).length}/${evaluationQuestions.length} questions répondues`}
          </Button>
        </div>
      )}
    </div>
  );
}
