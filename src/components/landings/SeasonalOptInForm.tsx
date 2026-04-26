"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  formSlug: string;
  isOpen: boolean;
  availableFromLabel?: string | null;
  ctaOpen: string;
  ctaWaitlist: string;
  /** Mention sous le bouton (ex: "Email quotidien du 1er au 24 decembre."). */
  reassurance: string;
}

/**
 * Form opt-in pour les landings saisonnieres (avent, chasse oeufs).
 * Wording adaptatif selon que le lead magnet est actif (fenetre ouverte)
 * ou en attente (annonce + waitlist).
 */
export default function SeasonalOptInForm({
  formSlug,
  isOpen,
  availableFromLabel,
  ctaOpen,
  ctaWaitlist,
  reassurance,
}: Props) {
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
      setError("Merci de remplir tous les champs et de cocher le consentement.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${formSlug}/submit`, {
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
      if (data.redirect_url) {
        router.push(data.redirect_url);
      } else {
        router.push(`/${formSlug}/merci`);
      }
    } catch {
      setError("Erreur serveur, reessaie dans 1 minute.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 shadow-lg">
      {!isOpen && availableFromLabel && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Pas encore ouvert. Inscris-toi maintenant pour recevoir le 1er email a l&apos;ouverture (le {availableFromLabel}).
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Ton prenom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-es-green"
          required
        />
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-es-green"
          required
        />
      </div>

      <input
        type="tel"
        placeholder="Telephone (optionnel)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-es-green"
      />

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          J&apos;accepte de recevoir les emails d&apos;Emeline Siron. Desinscription possible a tout moment.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-es-green text-white font-bold py-3 px-6 rounded-lg hover:bg-es-green/90 disabled:opacity-50 transition"
      >
        {submitting ? "Envoi..." : isOpen ? ctaOpen : ctaWaitlist}
      </button>

      <p className="text-xs text-gray-500 text-center">{reassurance}</p>
    </form>
  );
}
