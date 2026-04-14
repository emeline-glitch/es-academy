"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Mot de passe mis a jour</h2>
        <p className="text-gray-500 text-sm mb-4">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Button href="/connexion" variant="primary">Se connecter</Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-gray-500 text-sm mb-6">Choisis un nouveau mot de passe.</p>

      {error && (
        <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caracteres minimum"
          required
          minLength={8}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "Mise a jour..." : "Mettre a jour"}
        </Button>
      </form>
    </>
  );
}
