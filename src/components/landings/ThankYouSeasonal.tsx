import Link from "next/link";

interface Props {
  emoji: string;
  title: string;
  body: string;
  /** Wording pour le retour vers la home (default : "Retour a la home"). */
  backLabel?: string;
}

export default function ThankYouSeasonal({ emoji, title, body, backLabel = "Retour a la page d'accueil" }: Props) {
  return (
    <div className="min-h-screen bg-es-cream flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-es-green/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">{emoji}</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-es-text mb-4">{title}</h1>
        <p className="text-base text-es-text-muted mb-8 leading-relaxed">{body}</p>

        <div className="bg-es-cream/60 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-es-text mb-1">Et maintenant ?</p>
          <ul className="text-sm text-es-text-muted space-y-1.5 list-disc list-inside">
            <li>Verifie tes spams si tu ne vois pas le 1er mail dans 5 min.</li>
            <li>Ajoute <strong>emeline@emeline-siron.fr</strong> a tes contacts.</li>
            <li>Reponds au 1er mail si tu as une question, j&apos;y reponds personnellement.</li>
          </ul>
        </div>

        <Link href="/" className="inline-block text-sm text-es-green hover:underline font-semibold">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
