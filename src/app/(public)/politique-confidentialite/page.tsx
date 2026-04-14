import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
};

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-es-green-dark py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← Retour a l&apos;accueil
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white mt-4">Politique de confidentialite</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose-es">
        <h2>Responsable du traitement</h2>
        <p>
          Emeline Siron, representee par Emeline Siron, est responsable du traitement
          des donnees personnelles collectees sur le site ES Academy.
        </p>

        <h2>Donnees collectees</h2>
        <p>Nous collectons les donnees suivantes :</p>
        <ul>
          <li>Nom et prenom (lors de l&apos;inscription)</li>
          <li>Adresse email (inscription, newsletter, formulaires)</li>
          <li>Donnees de paiement (traitees par Stripe, non stockees par nous)</li>
          <li>Donnees de progression (lecons completees, quiz)</li>
          <li>Donnees de navigation (cookies analytiques, avec consentement)</li>
        </ul>

        <h2>Finalites du traitement</h2>
        <ul>
          <li>Gestion de votre compte et acces a la formation</li>
          <li>Suivi de votre progression pedagogique</li>
          <li>Envoi de newsletters et communications marketing (avec consentement)</li>
          <li>Amelioration de nos services</li>
          <li>Facturation et gestion comptable</li>
        </ul>

        <h2>Base legale</h2>
        <p>
          Le traitement est fonde sur l&apos;execution du contrat (acces a la formation),
          le consentement (newsletter), et l&apos;interet legitime (amelioration des services).
        </p>

        <h2>Duree de conservation</h2>
        <ul>
          <li>Donnees de compte : duree de l&apos;acces a la formation</li>
          <li>Donnees de facturation : 10 ans (obligation legale)</li>
          <li>Donnees newsletter : jusqu&apos;au desabonnement</li>
        </ul>

        <h2>Vos droits</h2>
        <p>
          Conformement au RGPD, vous disposez des droits suivants : acces, rectification,
          effacement, portabilite, limitation et opposition au traitement. Pour exercer
          ces droits : contact@emelinesiron.com
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site utilise des cookies strictement necessaires au fonctionnement. Les cookies
          analytiques ne sont deposes qu&apos;avec votre consentement.
        </p>

        <h2>Sous-traitants</h2>
        <ul>
          <li>Supabase (hebergement base de donnees, UE)</li>
          <li>Vercel (hebergement site, US avec clauses contractuelles)</li>
          <li>Stripe (paiement, certifie PCI-DSS)</li>
          <li>Bunny.net (hebergement video, UE)</li>
          <li>Amazon SES (envoi emails, UE)</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Pour toute question : contact@emelinesiron.com
        </p>
      </main>
    </div>
  );
}
