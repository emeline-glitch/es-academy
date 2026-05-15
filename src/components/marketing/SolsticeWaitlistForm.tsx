"use client";

import { useState } from "react";

/**
 * Formulaire d'inscription liste d'attente Solstice (page /solstice-bientot).
 * POST /api/solstice-waitlist (rate-limit + upsert CRM avec tag waitlist:solstice).
 */
export function SolsticeWaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email invalide");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/solstice-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Erreur réseau. Réessaie dans quelques secondes.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-left">
        <div className="flex items-start gap-3 bg-es-green/20 border border-es-green/30 rounded-xl p-4">
          <div className="w-9 h-9 rounded-full bg-es-green flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">C&apos;est noté.</p>
            <p className="text-sm text-white/80 mt-1">
              Tu reçois un mail d&apos;Antony dès que Solstice Patrimoine ouvre. À très vite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <label htmlFor="solstice-firstname" className="block text-xs font-medium text-white/70 mb-1.5">
          Prénom (optionnel)
        </label>
        <input
          id="solstice-firstname"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Marie"
          maxLength={80}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-es-gold focus:bg-white/15 transition-colors"
        />
      </div>
      <div>
        <label htmlFor="solstice-email" className="block text-xs font-medium text-white/70 mb-1.5">
          Email <span className="text-es-gold">*</span>
        </label>
        <input
          id="solstice-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="marie@email.com"
          required
          maxLength={200}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-es-gold focus:bg-white/15 transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full mt-2 bg-es-gold text-es-green-dark font-semibold py-3.5 rounded-lg hover:bg-es-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Envoi…" : "Être prévenu·e de l'ouverture"}
      </button>
    </form>
  );
}
