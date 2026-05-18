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
          <li>
            <strong>Donnees professionnelles publiques LinkedIn</strong> (prospection B2B) :
            nom, prenom, fonction, entreprise, URL LinkedIn, email professionnel.
            Voir section dediee ci-dessous.
          </li>
        </ul>

        <h2>Prospection B2B via LinkedIn et Waalaxy</h2>
        <p>
          Si tu recois un email de prospection de notre part sans inscription prealable,
          cela signifie que ton profil LinkedIn correspond a notre cible
          (investisseurs immobiliers, dirigeants, entrepreneurs). Voici en transparence
          comment nous procedons :
        </p>
        <ul>
          <li>
            <strong>Source des donnees</strong> : profils publics LinkedIn, enrichis
            via l&apos;outil <a href="https://waalaxy.com" target="_blank" rel="noopener">Waalaxy</a>
            qui retrouve l&apos;email professionnel a partir des donnees publiques.
          </li>
          <li>
            <strong>Donnees collectees</strong> : nom, prenom, fonction, entreprise,
            URL LinkedIn, email professionnel uniquement (pas d&apos;email personnel).
          </li>
          <li>
            <strong>Base juridique</strong> : interet legitime (RGPD art. 6.1.f).
            La prospection B2B ciblee est admise par la CNIL des lors que le sujet
            (formation a l&apos;investissement immobilier) est en rapport avec
            l&apos;activite professionnelle du destinataire.
          </li>
          <li>
            <strong>Information prealable</strong> : chaque email de prospection
            contient en tete une mention claire indiquant pourquoi tu le recois,
            la source des donnees, et un lien de desinscription en 1 clic.
          </li>
          <li>
            <strong>Duree de conservation</strong> : 3 ans maximum sans interaction
            (ouverture, clic, reponse). Au-dela, ton contact est automatiquement
            supprime de nos bases.
          </li>
          <li>
            <strong>Droit d&apos;opposition</strong> : tu peux te desinscrire en 1 clic
            via le lien dans tout email recu, ou nous ecrire a contact@emeline-siron.fr.
          </li>
        </ul>

        <h2>Finalites du traitement</h2>
        <ul>
          <li>Gestion de ton compte et acces a la formation</li>
          <li>Suivi de ta progression pedagogique</li>
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

        <h2>Tes droits</h2>
        <p>
          Conformement au RGPD, tu disposes des droits suivants : acces, rectification,
          effacement, portabilite, limitation et opposition au traitement. Pour exercer
          ces droits : contact@emeline-siron.fr
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site utilise des cookies strictement necessaires au fonctionnement. Les cookies
          analytiques ne sont deposes qu&apos;avec ton consentement.
        </p>

        <h2>Sous-traitants</h2>
        <ul>
          <li>Supabase (hebergement base de donnees, UE)</li>
          <li>Vercel (hebergement site, US avec clauses contractuelles)</li>
          <li>Stripe (paiement, certifie PCI-DSS)</li>
          <li>Bunny.net (hebergement video, UE)</li>
          <li>Amazon SES (envoi emails, UE)</li>
          <li>Waalaxy (outil de prospection LinkedIn B2B, France)</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Pour toute question : contact@emeline-siron.fr
        </p>
      </main>
    </div>
  );
}
