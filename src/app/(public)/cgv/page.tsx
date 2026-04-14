import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions generales de vente",
};

export default function CGV() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-es-green-dark py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← Retour a l&apos;accueil
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white mt-4">Conditions generales de vente</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose-es">
        <h2>Article 1 — Objet</h2>
        <p>
          Les presentes conditions generales de vente (CGV) regissent les ventes de formations
          en ligne proposees par Emeline Siron via le site ES Academy.
        </p>

        <h2>Article 2 — Produits</h2>
        <p>
          ES Academy propose des formations en ligne sous forme de videos, documents et outils
          telechargeables. L&apos;acces est accorde a vie apres paiement integral du prix.
        </p>

        <h2>Article 3 — Prix et paiement</h2>
        <p>
          Les prix sont indiques en euros TTC. Le paiement est effectue en ligne par carte bancaire
          via la plateforme securisee Stripe. Le paiement est exigible immediatement a la commande.
        </p>

        <h2>Article 4 — Acces a la formation</h2>
        <p>
          Apres confirmation du paiement, l&apos;acheteur recoit un email avec ses identifiants de
          connexion. L&apos;acces a la formation est personnel et non cessible.
        </p>

        <h2>Article 5 — Droit de retractation</h2>
        <p>
          Conformement a l&apos;article L221-18 du Code de la consommation, l&apos;acheteur dispose d&apos;un
          delai de 14 jours a compter de la date d&apos;achat pour exercer son droit de retractation.
          Pour cela, il suffit d&apos;envoyer un email a contact@emelinesiron.com. Le remboursement sera
          effectue sous 14 jours.
        </p>

        <h2>Article 6 — Propriete intellectuelle</h2>
        <p>
          Le contenu des formations (videos, documents, outils) est protege par le droit d&apos;auteur.
          L&apos;acheteur s&apos;engage a ne pas reproduire, distribuer ou partager le contenu avec des tiers.
        </p>

        <h2>Article 7 — Responsabilite</h2>
        <p>
          Les formations ont un but educatif. Emeline Siron ne saurait etre tenue
          responsable des decisions d&apos;investissement prises par l&apos;acheteur. Les resultats
          dependent de la situation personnelle de chacun.
        </p>

        <h2>Article 8 — Litiges</h2>
        <p>
          En cas de litige, les parties s&apos;engagent a rechercher une solution amiable. A defaut,
          les tribunaux competents d&apos;Aix-en-Provence seront saisis. Droit applicable : droit francais.
        </p>

        <h2>Article 9 — Contact</h2>
        <p>
          Emeline Siron<br />
          Email : contact@emelinesiron.com
        </p>
      </main>
    </div>
  );
}
