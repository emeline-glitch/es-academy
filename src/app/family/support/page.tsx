import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Support ES Family | Emeline Siron",
  description:
    "Centre d'aide ES Family : connexion, abonnement, suppression de compte, contact. Toutes les reponses aux questions des membres.",
  alternates: { canonical: "https://emeline-siron.fr/family/support" },
};

const faqItems = [
  {
    question: "Je n'arrive pas a me connecter dans l'app",
    answer:
      "Verifie que tu utilises bien l'email associe a ton abonnement. Sur la page de connexion, choisis Sign in with Apple, le lien magique recu par email, ou ton mot de passe. Si tu as oublie ton mot de passe, utilise la page Reinitialiser. Si rien ne marche, ecris-nous a contact@emeline-siron.fr avec ton email d'inscription.",
  },
  {
    question: "Comment souscrire a ES Family ?",
    answer:
      "L'abonnement se souscrit uniquement depuis notre site, sur la page emeline-siron.fr/family. L'app native sert a acceder au contenu apres souscription : elle ne traite aucun paiement.",
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer:
      "Tu peux annuler a tout moment sans engagement depuis la page emeline-siron.fr/family/desabonnement. L'annulation prend effet a la fin de la periode payee en cours. Aucun pro-rata n'est rembourse.",
  },
  {
    question: "Comment supprimer mon compte et mes donnees ?",
    answer:
      "Dans l'app, va dans Profil puis Parametres puis Supprimer mon compte. Tu peux aussi nous ecrire a contact@emeline-siron.fr avec ton email d'inscription. La suppression est definitive et concerne toutes tes donnees (profil, posts, commentaires, messages). Conformement au RGPD, le traitement est effectue sous 30 jours.",
  },
  {
    question: "Je n'ai pas recu mon email de bienvenue apres paiement",
    answer:
      "L'email de bienvenue arrive sous 5 minutes apres le paiement Stripe. Verifie d'abord tes spams. Si rien sous 1 heure, ecris-nous a contact@emeline-siron.fr avec ton email Stripe et l'heure approximative du paiement.",
  },
  {
    question: "Le contenu de l'app est protege par mot de passe, c'est normal ?",
    answer:
      "Oui. ES Family est une communaute privee reservee aux membres actifs. Sans abonnement valide, tu ne peux pas acceder au contenu communautaire (feed, videos, documents, evenements). Pour rejoindre, rendez-vous sur emeline-siron.fr/family.",
  },
  {
    question: "Sur quels appareils l'app fonctionne-t-elle ?",
    answer:
      "L'app native est disponible sur iPhone et iPad (iOS 15 ou plus). Une version Android arrive prochainement. Tu peux aussi acceder a la communaute via navigateur web sur esfamily.fr.",
  },
];

export default function FamilySupportPage() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header activePage="family" />

      <header className="bg-es-mint-deep py-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/family"
            className="text-white/70 text-sm hover:text-white transition-colors"
          >
            &larr; Retour a ES Family
          </Link>
          <h1 className="font-serif text-4xl font-bold text-white mt-4">
            Centre d&apos;aide
          </h1>
          <p className="text-white/85 mt-3 text-lg">
            Toutes les reponses aux questions courantes. Si tu ne trouves pas,
            on est joignable par email.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-6">
            Questions frequentes
          </h2>
          <Accordion items={faqItems} />
        </section>

        <section className="bg-white rounded-2xl border border-es-cream-dark p-8">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-4">
            Contacter le support
          </h2>
          <p className="text-es-text-muted mb-6">
            Pour toute question non couverte ci-dessus, ecris-nous directement.
            On repond sous 48h ouvrees.
          </p>
          <a
            href="mailto:contact@emeline-siron.fr"
            className="inline-block bg-es-mint-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-es-mint-deep transition"
          >
            contact@emeline-siron.fr
          </a>
          <div className="mt-8 pt-8 border-t border-es-cream-dark">
            <h3 className="font-semibold text-es-text mb-3">Pages utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/family"
                  className="text-es-mint-dark hover:underline"
                >
                  Page ES Family
                </Link>
              </li>
              <li>
                <Link
                  href="/family/desabonnement"
                  className="text-es-mint-dark hover:underline"
                >
                  Annuler mon abonnement
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  className="text-es-mint-dark hover:underline"
                >
                  Politique de confidentialite
                </Link>
              </li>
              <li>
                <Link
                  href="/cgv"
                  className="text-es-mint-dark hover:underline"
                >
                  Conditions generales de vente
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-es-mint-dark hover:underline"
                >
                  Mentions legales
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
