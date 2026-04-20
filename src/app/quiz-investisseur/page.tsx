"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuizLanding() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !email.trim() || !consent) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/forms/quiz-investisseur/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          phone: phone.trim() || undefined,
          consent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur");
        setSubmitting(false);
        return;
      }
      router.push(data.redirect_url || "/quiz-investisseur/play");
    } catch {
      setError("Erreur serveur, réessaie dans 1 minute.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-es-cream">
      <section className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-es-terracotta mb-4">
              Quiz vidéo gratuit · 5 min
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-es-text leading-tight mb-6">
              Es-tu fait pour l&apos;investissement locatif ?
            </h1>
            <p className="text-lg text-es-text-muted mb-8 leading-relaxed">
              9 mises en situation réelles. À chaque question, je te donne mon retour en vidéo. Tu ressors avec un score sur 10 et un profil personnalisé.
            </p>

            <div className="bg-white rounded-xl p-5 mb-8 border border-gray-100">
              <p className="text-sm font-semibold text-es-text mb-3">Tu vas être mise en situation sur :</p>
              <ul className="space-y-2 text-sm text-es-text-muted">
                <li>→ La négociation d&apos;une offre d&apos;achat</li>
                <li>→ Le RDV banquier</li>
                <li>→ Le choix fiscal (LMNP réel vs micro-BIC)</li>
                <li>→ Un locataire qui ne paie plus</li>
                <li>→ Une visite avec 3 points rouges</li>
                <li>→ Et 4 autres situations que tu rencontreras</li>
              </ul>
            </div>

            <p className="text-sm text-es-text-muted italic">
              À la fin, je te dis lequel des 3 profils tu es : <strong>tu perds de l&apos;argent</strong>, <strong>opération blanche</strong>, ou <strong>autofinancement positif</strong>. Sans filtre.
            </p>
          </div>

          {/* Formulaire opt-in */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 className="font-serif text-xl font-bold text-es-text text-center mb-2">
              Je fais le quiz
            </h2>
            <p className="text-sm text-es-text-muted text-center mb-6">
              5 min. 100% gratuit. Résultat par email immédiat.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom *"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Téléphone (optionnel)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
              />

              <label className="flex items-start gap-2 text-xs text-gray-600 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-gray-300 accent-es-green"
                />
                <span>
                  J&apos;accepte de recevoir mon résultat par email et les emails d&apos;Emeline. J&apos;ai lu la{" "}
                  <a href="/politique-confidentialite" target="_blank" className="text-es-green hover:underline">
                    politique de confidentialité
                  </a>
                  . *
                </span>
              </label>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-es-terracotta text-white font-semibold py-3.5 rounded-lg hover:bg-es-terracotta-dark transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? "Lancement…" : "Lancer le quiz"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
