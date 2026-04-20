"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MasterclassLanding() {
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
      const res = await fetch("/api/forms/masterclass/submit", {
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
      router.push(data.redirect_url || "/masterclass/merci");
    } catch {
      setError("Erreur serveur, réessaie dans 1 minute.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-es-cream">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-es-green mb-4">
              Masterclass gratuite · 58 min
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-es-text leading-tight mb-6">
              Les 3 décisions qui séparent un investisseur rentable d&apos;un propriétaire qui galère.
            </h1>
            <p className="text-lg text-es-text-muted mb-8 leading-relaxed">
              Ce que je transmets en priorité à mes élèves Academy.
              Pas de blabla, pas de vente cachée. 58 minutes de méthode directe, par Emeline SIRON.
            </p>
            <ul className="space-y-3 mb-8 text-es-text">
              <li className="flex items-start gap-3">
                <span className="text-es-green text-xl">✓</span>
                <span>La décision <strong>stratégique</strong> que 80% des débutants loupent</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-es-green text-xl">✓</span>
                <span>La décision <strong>fiscale</strong> qui m&apos;a coûté 28 000€ quand je l&apos;ai mal prise</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-es-green text-xl">✓</span>
                <span>La décision <strong>bancaire</strong> qui fait la différence entre 1 bien et 5 biens</span>
              </li>
            </ul>
            <p className="text-sm text-es-text-muted italic">
              &ldquo;Cette masterclass est peut-être la meilleure heure que tu investiras cette année.&rdquo;
            </p>
          </div>

          {/* Formulaire opt-in */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 className="font-serif text-xl font-bold text-es-text text-center mb-2">
              Je veux regarder la masterclass
            </h2>
            <p className="text-sm text-es-text-muted text-center mb-6">
              Accès immédiat. 100% gratuit.
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
                  J&apos;accepte de recevoir la masterclass et les emails d&apos;Emeline. J&apos;ai pris connaissance de la{" "}
                  <a href="/politique-confidentialite" target="_blank" className="text-es-green hover:underline">
                    politique de confidentialité
                  </a>
                  . Désinscription en 1 clic à tout moment. *
                </span>
              </label>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-es-green text-white font-semibold py-3.5 rounded-lg hover:bg-es-green-light transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? "Envoi…" : "Regarder la masterclass"}
              </button>
            </form>

            <p className="text-[10px] text-gray-400 text-center pt-4 italic">
              En t&apos;inscrivant, tu acceptes de recevoir mes emails (désinscription en 1 clic).
            </p>
          </div>
        </div>
      </section>

      {/* Preuve sociale */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="font-serif text-3xl font-bold text-es-green">1 800+</p>
              <p className="text-sm text-es-text-muted mt-1">élèves formés</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-es-green">4,9/5</p>
              <p className="text-sm text-es-text-muted mt-1">sur Trustpilot</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-es-green">68%</p>
              <p className="text-sm text-es-text-muted mt-1">passent à l&apos;action en 12 mois</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
