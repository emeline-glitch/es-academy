"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Page de reset password.
 *
 * Flow : l'user arrive ici via le lien email avec un hash
 * #access_token=...&refresh_token=...&type=recovery dans l'URL.
 * On l'extrait, on appelle setSession() pour etablir la session cote
 * client, puis on affiche le formulaire. updateUser fonctionnera alors
 * avec la session valide.
 *
 * Sans cette logique, le client Supabase ne parse pas le hash dans une
 * page SSR Next.js App Router et updateUser plante avec "Auth session
 * missing".
 */
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    async function establishSession() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (!hash || hash.length < 2) {
        // Pas de hash : peut-etre que la session est deja la (refresh page)
        // ou que l'user est arrive sans lien valide.
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSessionReady(true);
        } else {
          setSessionError("Lien invalide ou expiré. Redemande un email de réinitialisation.");
        }
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const errorDesc = params.get("error_description");

      if (errorDesc) {
        setSessionError(decodeURIComponent(errorDesc).replace(/\+/g, " "));
        return;
      }

      if (!access_token || !refresh_token) {
        setSessionError("Lien invalide. Redemande un email de réinitialisation.");
        return;
      }

      const supabase = createClient();
      const { error: sessErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessErr) {
        setSessionError("Lien expiré. Redemande un email de réinitialisation.");
        return;
      }

      // Nettoie l'URL pour ne pas laisser le token dans la barre.
      window.history.replaceState(null, "", window.location.pathname);
      setSessionReady(true);
    }

    establishSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError(updateErr.message);
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
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Mot de passe mis à jour</h2>
        <p className="text-gray-500 text-sm mb-4">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Button href="/connexion" variant="primary">Se connecter</Button>
      </div>
    );
  }

  if (sessionError) {
    return (
      <>
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
          Lien expiré
        </h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-4 mb-6">
          {sessionError}
        </div>
        <Button href="/mot-de-passe-oublie" variant="primary" size="lg" className="w-full">
          Demander un nouveau lien
        </Button>
      </>
    );
  }

  if (!sessionReady) {
    return (
      <div className="text-center text-gray-400 text-sm py-12">
        Vérification du lien…
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
          placeholder="8 caractères minimum"
          required
          minLength={8}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "Mise à jour…" : "Mettre à jour"}
        </Button>
      </form>
    </>
  );
}
