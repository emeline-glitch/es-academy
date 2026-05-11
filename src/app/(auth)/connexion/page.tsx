"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSearchParams } from "next/navigation";

function ConnexionForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const linkExpired = searchParams.get("error") === "auth";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    window.location.href = redirect;
  }

  async function handleSendMagicLink() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Entre ton email d'abord.");
      return;
    }
    setError("");
    setMagicLinkLoading(true);
    try {
      await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMagicLinkSent(true);
    } catch {
      setError("Erreur reseau. Reessaie dans quelques secondes.");
    } finally {
      setMagicLinkLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        Connexion
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Accede a ta formation et tes outils.
      </p>

      {linkExpired && !magicLinkSent && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-4 mb-6">
          <p className="font-medium mb-1">Ton lien de connexion a expire.</p>
          <p className="text-xs">Entre ton email ci-dessous et clique &quot;Recevoir un nouveau lien&quot; pour te connecter sans mot de passe.</p>
        </div>
      )}

      {checkoutSuccess && (
        <div className="bg-green-50 text-green-800 text-sm rounded-lg p-4 mb-6">
          Paiement reussi ! Connecte-toi pour acceder a ta formation.
        </div>
      )}

      {magicLinkSent && (
        <div className="bg-green-50 text-green-800 text-sm rounded-lg p-4 mb-6">
          Si un compte existe avec cet email, un lien de connexion vient de partir. Verifie ta boite (et tes indesirables).
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4 mb-6">
          {error}
        </div>
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
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSendMagicLink}
          disabled={magicLinkLoading || magicLinkSent}
          className="w-full text-sm text-es-green hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {magicLinkLoading
            ? "Envoi en cours..."
            : magicLinkSent
              ? "Lien envoye"
              : "Recevoir un lien de connexion par email"}
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
        <p>
          <a
            href="/mot-de-passe-oublie"
            className="text-es-green hover:underline"
          >
            Mot de passe oublie ?
          </a>
        </p>
        <p>
          Pas encore de compte ?{" "}
          <a href="/inscription" className="text-es-green font-medium hover:underline">
            S&apos;inscrire
          </a>
        </p>
      </div>
    </>
  );
}

export default function Connexion() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Chargement...</div>}>
      <ConnexionForm />
    </Suspense>
  );
}
