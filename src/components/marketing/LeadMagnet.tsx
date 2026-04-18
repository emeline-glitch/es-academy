"use client";

import { useState } from "react";

export function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !consent) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "lead_magnet", tags: ["lead_magnet"] }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-es-green rounded-2xl p-8 lg:p-12 text-center text-white">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-es-gold" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-bold mb-2">C&apos;est envoyé !</h3>
        <p className="text-white/70">Vérifie ta boîte mail (et les spams).</p>
      </div>
    );
  }

  return (
    <div className="bg-es-green rounded-2xl p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Gratuit</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-2 mb-4">
            3 outils offerts pour ton premier investissement
          </h3>
          <ul className="space-y-3 text-white/70 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-es-gold">📊</span>
              Simulateur de rentabilité locative
            </li>
            <li className="flex items-center gap-2">
              <span className="text-es-gold">✅</span>
              Checklist visite complète (47 points)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-es-gold">📖</span>
              Guide : financer sans apport (PDF)
            </li>
          </ul>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ton email"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-es-gold/50 focus:border-es-gold transition-all"
            />
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-white/30 accent-es-gold"
              />
              <span className="text-[11px] text-white/50 leading-relaxed">
                J&apos;accepte de recevoir des emails de la part d&apos;Emeline Siron
              </span>
            </label>
            <button
              type="submit"
              disabled={status === "loading" || !consent}
              className="w-full px-4 py-3.5 rounded-xl bg-es-gold text-white font-semibold hover:bg-es-gold-dark transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Envoi..." : "Recevoir mes outils gratuits →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
