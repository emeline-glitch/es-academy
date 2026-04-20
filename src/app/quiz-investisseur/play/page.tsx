import Link from "next/link";

export const metadata = {
  title: "Quiz en cours | Emeline Siron",
};

/**
 * Page intermédiaire après opt-in : redirige vers VideoAsk (V1) ou affiche le quiz custom (V2).
 * V1 : on passe l'URL VideoAsk en env var NEXT_PUBLIC_VIDEOASK_QUIZ_URL.
 * Si absent, on affiche un message temporaire.
 */
export default function QuizPlay() {
  const videoAskUrl = process.env.NEXT_PUBLIC_VIDEOASK_QUIZ_URL;

  return (
    <div className="min-h-screen bg-es-cream flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-es-terracotta/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎬</span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-es-text mb-4">
          Prête pour le quiz ?
        </h1>

        <p className="text-base text-es-text-muted mb-6 leading-relaxed">
          Tu vas être mise en situation dans 9 scénarios. À chaque réponse, je te donne mon retour en vidéo.
        </p>

        <div className="bg-es-cream/60 rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-semibold text-es-text mb-2">Avant de commencer :</p>
          <ul className="text-sm text-es-text-muted space-y-1.5 list-disc list-inside">
            <li>Utilise un casque ou des enceintes</li>
            <li>Réponds avec ton premier réflexe, pas ce que tu penses être &ldquo;la bonne réponse&rdquo;</li>
            <li>Compte 5 à 7 minutes au total</li>
          </ul>
        </div>

        {videoAskUrl ? (
          <a
            href={videoAskUrl}
            className="inline-block px-8 py-4 bg-es-terracotta text-white text-base font-semibold rounded-lg hover:bg-es-terracotta-dark"
          >
            Lancer le quiz maintenant →
          </a>
        ) : (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
            Le quiz arrive. On te recontacte par email quand il est prêt.
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Tu recevras ton résultat détaillé par email dès que tu auras terminé.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href="/" className="text-sm text-es-green hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
