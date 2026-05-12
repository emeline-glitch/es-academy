import "server-only";

/**
 * Donnees de l'examen final ES Academy : 30 questions a choix unique sur les
 * 14 modules. Stockees en code (et non en DB) pour la simplicite du MVP. Si
 * Emeline veut editer sans deploiement, faire migration vers quiz_questions
 * + quiz_options (table existante migration 045) avec lesson_code='EVAL-FINAL'.
 *
 * SECURITE : ce module est server-only (import "server-only" en haut). Il
 * NE DOIT JAMAIS etre importe cote client, sinon les `correct` apparaitraient
 * dans le bundle JS et un eleve pourrait recuperer les bonnes reponses via
 * DevTools. Toute import depuis un fichier "use client" fait throw au build.
 *
 * La page /(platform)/evaluation est un Server Component qui appelle
 * getEvaluationQuestionsForClient() pour passer au client le texte des
 * questions/choix UNIQUEMENT (sans le champ correct). Le scoring se fait
 * cote serveur dans /api/evaluation/submit.
 */

interface EvaluationQuestion {
  question: string;
  choices: string[];
  correct: number;
}

const QUESTIONS: EvaluationQuestion[] = [
  // Module 1 : Mindset & fondamentaux
  { question: "Quel est le principal avantage de l'effet de levier en immobilier ?", choices: ["Payer moins d'impôts", "Acheter à crédit pour se constituer un patrimoine", "Obtenir des réductions chez le notaire", "Négocier le prix du bien"], correct: 1 },
  { question: "Que signifie l'autofinancement d'un bien locatif ?", choices: ["Le bien est payé comptant", "Les loyers couvrent la mensualité de crédit et les charges", "Le vendeur finance l'achat", "L'État subventionne l'achat"], correct: 1 },
  { question: "Pourquoi est-il important de définir sa stratégie avant d'investir ?", choices: ["Pour impressionner le banquier", "Pour savoir quel type de bien chercher et quel rendement viser", "Pour obtenir un meilleur taux", "Ce n'est pas nécessaire"], correct: 1 },
  // Module 2 : Fiscalite
  { question: "Quel statut fiscal permet d'amortir un bien meublé ?", choices: ["SCI à l'IR", "Micro-foncier", "LMNP au réel", "Déficit foncier"], correct: 2 },
  { question: "Quelle est la différence entre le micro-BIC et le régime réel en LMNP ?", choices: ["Le micro-BIC permet de déduire plus de charges", "Le régime réel permet d'amortir le bien et déduire les charges réelles", "Il n'y a aucune différence", "Le régime réel est réservé aux professionnels"], correct: 1 },
  { question: "Qu'est-ce que le déficit foncier ?", choices: ["Un bénéfice imposable", "Quand les charges déductibles dépassent les revenus fonciers", "Une taxe supplémentaire", "Un avantage réservé aux SCI"], correct: 1 },
  // Module 3 : Financement
  { question: "Quel document est indispensable pour une demande de crédit immobilier ?", choices: ["Le bail du locataire", "Le business plan de l'opération", "Le certificat de naissance", "Le permis de construire"], correct: 1 },
  { question: "Qu'est-ce qu'un différé bancaire ?", choices: ["Un délai avant de commencer à rembourser le crédit", "Un taux d'intérêt variable", "Une assurance emprunteur", "Un frais de dossier"], correct: 0 },
  { question: "Quel est le taux d'endettement maximum généralement accepté par les banques ?", choices: ["25%", "33%", "35%", "50%"], correct: 2 },
  { question: "Pourquoi un apport personnel peut-il aider à obtenir un meilleur taux ?", choices: ["Il prouve au banquier ta capacité d'épargne", "Il est obligatoire", "Il remplace l'assurance emprunteur", "Il n'a aucun impact"], correct: 0 },
  // Module 4 : Recherche de biens
  { question: "Quel est le premier réflexe avant de visiter un bien ?", choices: ["Appeler le notaire", "Calculer la rentabilité prévisionnelle", "Signer un mandat", "Demander un crédit"], correct: 1 },
  { question: "Qu'est-ce qu'une étude de marché locatif ?", choices: ["Un document du notaire", "L'analyse de l'offre et la demande locative dans un secteur", "Un diagnostic immobilier", "Un rapport de l'agent immobilier"], correct: 1 },
  { question: "Quel critère est le plus important pour un investissement locatif ?", choices: ["La beauté du bien", "L'emplacement et la demande locative", "Le nombre de pièces", "L'année de construction"], correct: 1 },
  // Module 5 : Negociation
  { question: "Quel est le meilleur moment pour négocier le prix d'un bien ?", choices: ["Après la signature du compromis", "Dès la première visite en identifiant les défauts", "Jamais, le prix affiché est fixe", "Uniquement si le bien est en vente depuis plus d'un an"], correct: 1 },
  { question: "Quelle est la durée légale du droit de rétractation après signature d'un compromis ?", choices: ["7 jours", "10 jours", "14 jours", "30 jours"], correct: 1 },
  // Module 6 : Types de location
  { question: "Quel type de location offre généralement le meilleur rendement ?", choices: ["Location nue longue durée", "Location meublée / colocation", "Location à un proche", "Location de parking"], correct: 1 },
  { question: "Quelle est la durée minimum d'un bail en location meublée ?", choices: ["6 mois", "1 an", "3 ans", "9 mois pour un étudiant"], correct: 1 },
  { question: "Qu'est-ce que la colocation apporte de plus qu'une location classique ?", choices: ["Moins de gestion", "Un loyer global plus élevé par rapport à la surface", "Aucun avantage", "Moins de fiscalité"], correct: 1 },
  // Module 7 : Travaux & valorisation
  { question: "Pourquoi les travaux sont-ils un levier de rentabilité ?", choices: ["Ils permettent d'augmenter la valeur du bien et le loyer", "Ils sont obligatoires", "Ils diminuent les impôts uniquement", "Ils n'ont aucun impact"], correct: 0 },
  { question: "Qu'est-ce que la division d'un lot immobilier ?", choices: ["Vendre un bien en plusieurs fois", "Transformer un grand logement en plusieurs petits pour augmenter le rendement", "Diviser le crédit en deux", "Séparer le terrain de la maison"], correct: 1 },
  // Module 8 : Gestion locative
  { question: "Quel est l'avantage principal de gérer soi-même ses locations ?", choices: ["Économiser les frais d'agence (6-8% des loyers)", "C'est obligatoire en LMNP", "Ça prend moins de temps", "Le locataire paie mieux"], correct: 0 },
  { question: "Quelle assurance protège contre les loyers impayés ?", choices: ["L'assurance habitation", "La garantie loyers impayés (GLI)", "L'assurance emprunteur", "La RC Pro"], correct: 1 },
  // Module 9 : Structuration patrimoniale
  { question: "Qu'est-ce qu'une SCI ?", choices: ["Une Société Commerciale Immobilière", "Une Société Civile Immobilière", "Un Statut de Contribuable Immobilier", "Une Société de Crédit Immobilier"], correct: 1 },
  { question: "Dans quel cas une SCI à l'IS est-elle intéressante ?", choices: ["Pour habiter le bien", "Pour capitaliser et réinvestir les bénéfices", "Pour payer plus d'impôts", "Jamais, c'est toujours désavantageux"], correct: 1 },
  { question: "Qu'est-ce qu'une holding immobilière ?", choices: ["Un type de crédit", "Une société qui détient des parts dans d'autres sociétés immobilières", "Un impôt sur la fortune", "Un bien de prestige"], correct: 1 },
  // Module 10 : Rentabilite avancee
  { question: "Comment calcule-t-on le rendement brut ?", choices: ["Loyer annuel / prix d'achat × 100", "Loyer mensuel × 12", "Prix d'achat / loyer annuel", "Cash-flow × 12 / prix"], correct: 0 },
  { question: "Quelle est la différence entre rendement brut et rendement net ?", choices: ["Il n'y a aucune différence", "Le net déduit les charges, taxes et vacance locative", "Le brut est toujours plus bas", "Le net inclut la plus-value"], correct: 1 },
  // Module 11 : Plus-value & revente
  { question: "Au bout de combien d'années la plus-value immobilière est-elle exonérée d'impôts (résidence secondaire) ?", choices: ["10 ans", "15 ans", "22 ans pour l'IR, 30 ans pour les prélèvements sociaux", "Jamais"], correct: 2 },
  // Module 12 : Passage a l'action
  { question: "Quel est le risque principal de ne pas passer à l'action ?", choices: ["Perdre de l'argent", "Rater des opportunités et l'effet du temps sur la constitution de patrimoine", "Être pénalisé par les impôts", "Il n'y a aucun risque"], correct: 1 },
  { question: "Quelle est la première étape concrète pour investir ?", choices: ["Acheter un bien immédiatement", "Définir ses objectifs, son budget et commencer les recherches", "Créer une SCI", "Attendre que les prix baissent"], correct: 1 },
];

export const EVALUATION_TOTAL_QUESTIONS = QUESTIONS.length;
export const EVALUATION_PASS_PERCENTAGE = 70;

/**
 * Liste serializable a passer au client : question + choices SANS le champ correct.
 * Les indices array sont preserves (qi = position dans la liste).
 */
export interface PublicEvaluationQuestion {
  question: string;
  choices: string[];
}

export function getEvaluationQuestionsForClient(): PublicEvaluationQuestion[] {
  return QUESTIONS.map(({ question, choices }) => ({ question, choices }));
}

/**
 * Server-only : retourne l'array des indices corrects. A utiliser
 * UNIQUEMENT dans /api/evaluation/submit pour scorer.
 */
export function getEvaluationCorrectAnswers(): number[] {
  return QUESTIONS.map((q) => q.correct);
}
