import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions legales",
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-es-green-dark py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← Retour a l&apos;accueil
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white mt-4">Mentions legales</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose-es">
        <h2>Editeur du site</h2>
        <p>
          <strong>Emeline Siron</strong><br />
          Siege social : Aix-en-Provence<br />
          SIRET : [A completer]<br />
          RCS : [A completer]<br />
          Capital social : [A completer]<br />
          Directrice de la publication : Emeline Siron
        </p>

        <h2>Hebergement</h2>
        <p>
          Le site est heberge par <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
          Site : vercel.com
        </p>

        <h2>Propriete intellectuelle</h2>
        <p>
          L&apos;ensemble du contenu de ce site (textes, images, videos, logos, marques) est protege
          par les lois relatives a la propriete intellectuelle. Toute reproduction, meme partielle,
          est interdite sans autorisation ecrite prealable d&apos;Emeline Siron.
        </p>

        <h2>Donnees personnelles</h2>
        <p>
          Conformement au RGPD, vous disposez d&apos;un droit d&apos;acces, de rectification et de
          suppression de vos donnees personnelles. Pour exercer ces droits, contactez-nous a :
          contact@emelinesiron.com
        </p>

        <h2>Contact</h2>
        <p>
          Email : contact@emelinesiron.com
        </p>
      </main>
    </div>
  );
}
