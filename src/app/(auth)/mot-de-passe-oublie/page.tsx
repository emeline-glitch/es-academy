"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // On passe par notre endpoint qui envoie un email SES chartré avec
    // le template `reset_password` (au lieu du mail Supabase par défaut).
    // Le serveur génère le lien via admin.generateLink(type='recovery'),
    // rend le template depuis email_templates et envoie via SES.
    try {
      await fetch("/api/auth/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Erreur réseau. Réessaie dans quelques secondes.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Email envoyé</h2>
        <p className="text-gray-500 text-sm">
          Si un compte existe avec <strong>{email}</strong>, tu recevras un lien pour réinitialiser ton mot de passe.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        Mot de passe oublié
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Entre ton email pour recevoir un lien de réinitialisation.
      </p>

      {error && (
        <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          required
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <a href="/connexion" className="text-es-green hover:underline">Retour à la connexion</a>
      </div>
    </>
  );
}
