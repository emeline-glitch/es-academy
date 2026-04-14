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
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const checkoutSuccess = searchParams.get("checkout") === "success";

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

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        Connexion
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Accede a ta formation et tes outils.
      </p>

      {checkoutSuccess && (
        <div className="bg-green-50 text-green-800 text-sm rounded-lg p-4 mb-6">
          Paiement reussi ! Connecte-toi pour acceder a ta formation.
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
