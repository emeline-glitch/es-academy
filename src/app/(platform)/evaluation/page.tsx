import {
  EVALUATION_PASS_PERCENTAGE,
  EVALUATION_TOTAL_QUESTIONS,
  getEvaluationQuestionsForClient,
} from "@/lib/evaluation/data";
import { EvaluationClient } from "./EvaluationClient";

/**
 * Server Component : recupere les questions cote serveur (sans champ `correct`)
 * et les passe au Client Component pour l'UI. Le scoring se fait integralement
 * cote serveur via /api/evaluation/submit. Voir src/lib/evaluation/data.ts
 * pour le rationnel securite.
 */
export default function EvaluationPage() {
  const questions = getEvaluationQuestionsForClient();
  return (
    <EvaluationClient
      questions={questions}
      totalQuestions={EVALUATION_TOTAL_QUESTIONS}
      passThreshold={EVALUATION_PASS_PERCENTAGE}
    />
  );
}
