import Link from "next/link";

export const metadata = {
  title: "Merci | Masterclass",
};

export default function MerciMasterclass() {
  return (
    <div className="min-h-screen bg-es-cream flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-es-green/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✉️</span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-es-text mb-4">
          C&apos;est confirmé !
        </h1>

        <p className="text-base text-es-text-muted mb-6 leading-relaxed">
          Ta masterclass t&apos;arrive dans ta boîte mail dans les 2 prochaines minutes.
        </p>

        <div className="bg-es-cream/60 rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-semibold text-es-text mb-2">⚡ 3 conseils avant de la regarder :</p>
          <ol className="text-sm text-es-text-muted space-y-1.5 list-decimal list-inside">
            <li>Bloque-toi 1 heure au calme</li>
            <li>Prends un carnet et un stylo (il y a 3 exercices)</li>
            <li>Mets ton téléphone en mode avion</li>
          </ol>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Si tu ne reçois rien dans 5 minutes, vérifie ton dossier "Spam" ou "Promotions". Le mail vient de <strong>emeline@emeline-siron.fr</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            Lire le blog
          </Link>
          <Link
            href="/podcast"
            className="px-6 py-3 bg-es-green text-white text-sm font-semibold rounded-lg hover:bg-es-green-light"
          >
            Écouter le podcast
          </Link>
        </div>
      </div>
    </div>
  );
}
