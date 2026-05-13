"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";

interface Props {
  email: string;
}

/**
 * Section sécurité : changement mot de passe via Supabase Reset Password flow.
 * Pas de form direct ici, car ca obligerait a faire revalidation du mot de
 * passe actuel cote backend. Le flow reset par email est plus sur.
 *
 * 2FA : Supabase supporte MFA (TOTP). Pour l'instant on l'expose comme
 * "bientôt disponible" car l'enrollment d'un authenticator (QR code, etc)
 * justifie une UI dediee qu'on fera dans un sprint ulterieur.
 */
export function SecuritySection({ email }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendResetLink() {
    setState("sending");
    const supabase = createClient();
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setState(error ? "error" : "sent");
  }

  return (
    <Card>
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Sécurité</h2>
      <p className="text-sm text-gray-500 mb-5">Garde ton compte en sécurité.</p>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">Mot de passe</p>
            <p className="text-xs text-gray-500 mt-0.5">
              On t&apos;envoie un lien de reinitialisation a {email}.
            </p>
            {state === "sent" && (
              <p className="text-xs text-green-800 mt-2">Mail envoyé, regarde ta boite (et tes spams).</p>
            )}
            {state === "error" && (
              <p className="text-xs text-red-700 mt-2">Impossible d&apos;envoyer le mail. Réessaie.</p>
            )}
          </div>
          <button
            type="button"
            onClick={sendResetLink}
            disabled={state === "sending" || state === "sent"}
            className="shrink-0 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-es-green hover:text-es-green transition-colors disabled:opacity-60 cursor-pointer"
          >
            {state === "sending" ? "Envoi..." : state === "sent" ? "Envoyé" : "Recevoir le lien"}
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-100 opacity-70">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">Double authentification (2FA)</p>
            <p className="text-xs text-gray-500 mt-0.5">Code a usage unique via application authenticator. Bientôt disponible.</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-400">A venir</span>
        </div>
      </div>
    </Card>
  );
}
