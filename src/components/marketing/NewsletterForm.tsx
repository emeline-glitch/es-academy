"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !consent) return;
    setStatus("loading");

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "newsletter", tags: ["newsletter"] }),
    });

    setStatus(res.ok ? "success" : "error");
    if (res.ok) setEmail("");
  }

  if (status === "success") {
    return (
      <div className="bg-es-green/10 rounded-lg p-4 text-center">
        <p className="text-es-green font-medium text-sm">Bienvenue dans la communauté ! 🎉</p>
        <p className="text-xs text-gray-500 mt-1">Vérifie ta boîte mail.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ton adresse email"
          required
          className="flex-1 px-4 py-3 rounded-lg border border-es-cream-dark bg-white text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30"
        />
        <button
          type="submit"
          disabled={status === "loading" || !consent}
          className="px-6 py-3 bg-es-green text-white rounded-lg font-medium text-sm hover:bg-es-green-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "..." : "S'inscrire gratuitement"}
        </button>
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 accent-es-green"
        />
        <span className="text-xs text-gray-500 leading-relaxed">
          J&apos;accepte de recevoir des emails de la part d&apos;Emeline Siron. Désinscription possible à tout moment.
        </span>
      </label>
    </form>
  );
}
