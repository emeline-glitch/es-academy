import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";

export const metadata: Metadata = {
  title: "Bienvenue dans ES Family | Emeline Siron",
  description: "Ton inscription à ES Family est confirmée. Active ton compte et télécharge l'app pour démarrer.",
  robots: { index: false, follow: false },
};

// PLACEHOLDERS app stores : à remplacer dès qu'Emeline confirme les URLs publiées.
// Tant que ces URLs sont X, les boutons sont rendus mais pointent vers /family
// (fallback sécurité, l'utilisateur n'arrive nulle part de cassé).
const APP_STORE_URL = "https://apps.apple.com/X";
const PLAY_STORE_URL = "https://play.google.com/store/apps/X";

// Domain Family indépendant (Supabase Family séparé de Academy, pas de SSO).
// Le user clique "Me connecter" → arrive sur l'app esfamily.fr (Vercel séparé).
const FAMILY_LOGIN_URL = "https://esfamily.fr/connexion";

interface SearchParams {
  plan?: string;
}

export default async function FamilyBienvenuePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  // plan disponible en query (pour analytics) mais NON affiché à l'écran :
  // l'expérience après paiement doit être identique pour fondateur et standard
  // (zéro différenciation cosmétique, ce qui change c'est le tarif Stripe).
  const sp = await props.searchParams;
  const planValue = sp.plan === "fondateur" ? 19 : sp.plan === "standard" ? 29 : undefined;

  return (
    <div className="min-h-screen bg-es-cream">
      <PurchaseTracker product="family" value={planValue} currency="EUR" plan={sp.plan} />
      <Header activePage="family" />

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        {/* Bandeau de validation */}
        <div className="bg-es-mint-soft border border-es-mint rounded-2xl p-8 md:p-10 text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-es-green text-white mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-es-text mb-3">
            Bienvenue dans ES Family
          </h1>
          <p className="text-base md:text-lg text-es-text-muted mb-2">
            Ton inscription est confirmée.
          </p>
          <p className="text-sm text-es-text-muted">
            Tu vas recevoir un mail de bienvenue dans 2 minutes. Vérifie tes spams si rien dans 5 min.
          </p>
        </div>

        {/* Étape 1 : Connexion */}
        <section className="bg-white rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-es-green text-white font-bold flex items-center justify-center">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-es-text mb-2">
                Connecte-toi à ton espace
              </h2>
              <p className="text-es-text-muted mb-4">
                Ton compte Family a été créé automatiquement avec l'email que tu as utilisé pour le paiement.
                Si c'est ta première inscription, tu vas recevoir un mail séparé pour définir ton mot de passe.
              </p>
              <a
                href={FAMILY_LOGIN_URL}
                className="inline-block bg-es-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-es-green-dark transition"
              >
                Me connecter à Family
              </a>
            </div>
          </div>
        </section>

        {/* Étape 2 : Téléchargement app */}
        <section className="bg-white rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-es-green text-white font-bold flex items-center justify-center">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-es-text mb-2">
                Télécharge l'app (recommandé)
              </h2>
              <p className="text-es-text-muted mb-4">
                Notifications pour les lives, accès rapide depuis ton téléphone, lecture en mode déconnecté.
                L'expérience la plus fluide pour suivre la communauté au quotidien.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  App Store (iOS)
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.119 12l2.579-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z" />
                  </svg>
                  Google Play (Android)
                </a>
              </div>
              <p className="text-xs text-es-text-muted mt-3">
                Tu peux aussi accéder à Family directement depuis ton navigateur via "Me connecter".
              </p>
            </div>
          </div>
        </section>

        {/* Étape 3 : Ce qui t'attend */}
        <section className="bg-white rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-es-green text-white font-bold flex items-center justify-center">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-es-text mb-2">
                Ce que tu vas trouver dans ton espace
              </h2>
              <ul className="space-y-2 text-es-text-muted">
                <li className="flex gap-2">
                  <span className="text-es-green font-bold">·</span>
                  <span>Un feed vivant avec des discussions par pilier (immo, fiscalité, bourse, entrepreneuriat)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-es-green font-bold">·</span>
                  <span>5 simulateurs pour décider vite (capacité d'emprunt, cashflow, frais de notaire, prix au m², rendement)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-es-green font-bold">·</span>
                  <span>Les lives mensuels avec moi et mes partenaires experts, plus tous les replays à vie</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-es-green font-bold">·</span>
                  <span>Les ressources prêtes à l'emploi : modèles de courriers, fiches techniques, ebooks mensuels, 34 fichiers classés par thème</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-es-green font-bold">·</span>
                  <span>L'annuaire des membres et les bons plans négociés auprès de mes partenaires (courtiers, assurances PNO, artisans)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <p className="text-center text-sm text-es-text-muted mt-10">
          Une question ? Réponds simplement au mail de bienvenue, je lis tout.
        </p>
      </main>

      <Footer />
    </div>
  );
}
