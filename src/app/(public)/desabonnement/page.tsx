"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Page /desabonnement avec 2 paths GDPR-compliant :
 *
 * 1. Lien email avec ?email=X&token=Y : 1-click auto-confirm (article 21 RGPD)
 *    On POST le token a l'API qui verifie l'HMAC, unsubscribe immediat.
 *
 * 2. Form manuel sans params : user perd son email = path "manual".
 *    On POST avec source=manual, l'API envoie un mail de confirmation
 *    avec un lien token. Le user doit cliquer dans le mail pour finaliser.
 *
 * Pas d'unsubscribe possible sans preuve de possession de la boite mail.
 */

type PageStatus =
  | "idle"
  | "loading"
  | "success_token"
  | "success_manual"
  | "error_token"
  | "error_manual";

function DesabonnementContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<PageStatus>("idle");

  // Path 1 : auto-confirm si ?email + ?token presents
  useEffect(() => {
    if (!emailParam || !tokenParam) return;
    let cancelled = false;
    setStatus("loading");

    fetch("/api/contacts/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailParam, token: tokenParam }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) setStatus("success_token");
        else setStatus("error_token");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error_token");
      });

    return () => {
      cancelled = true;
    };
  }, [emailParam, tokenParam]);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contacts/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "manual" }),
      });

      if (res.ok) setStatus("success_manual");
      else setStatus("error_manual");
    } catch {
      setStatus("error_manual");
    }
  }

  // === Rendu ===

  if (status === "success_token") {
    return (
      <CardLayout>
        <SuccessIcon />
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">
          Désabonnement confirmé
        </h2>
        <p className="text-gray-500 text-sm">
          Tu ne recevras plus d&apos;emails marketing de notre part.
        </p>
      </CardLayout>
    );
  }

  if (status === "success_manual") {
    return (
      <CardLayout>
        <MailIcon />
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">
          Vérifie ta boîte mail
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          On t&apos;a envoyé un mail à <strong>{email}</strong>.
        </p>
        <p className="text-gray-500 text-sm">
          Clique sur le lien dans ce mail pour finaliser ton désabonnement.
        </p>
      </CardLayout>
    );
  }

  if (status === "error_token") {
    return (
      <CardLayout>
        <ErrorIcon />
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">
          Lien invalide ou expiré
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Le lien que tu as suivi n&apos;est pas valide. Utilise le formulaire
          ci-dessous pour demander un nouveau lien.
        </p>
        <ManualForm
          email={email}
          setEmail={setEmail}
          loading={false}
          onSubmit={handleManualSubmit}
        />
      </CardLayout>
    );
  }

  // idle, loading, error_manual
  return (
    <CardLayout>
      <h1 className="font-serif text-xl font-bold text-gray-900 mb-2">
        Se désabonner
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Entre ton email. On t&apos;enverra un lien de confirmation par mail.
      </p>

      {status === "error_manual" && (
        <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4 mb-4">
          Une erreur est survenue. Réessaie ou écris à emeline@emeline-siron.fr.
        </div>
      )}

      <ManualForm
        email={email}
        setEmail={setEmail}
        loading={status === "loading"}
        onSubmit={handleManualSubmit}
      />
    </CardLayout>
  );
}

function CardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

function ManualForm({
  email,
  setEmail,
  loading,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.com"
        required
      />
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? "..." : "Recevoir le lien de confirmation"}
      </Button>
    </form>
  );
}

function SuccessIcon() {
  return (
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function MailIcon() {
  return (
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
  );
}

export default function Desabonnement() {
  return (
    <Suspense fallback={<CardLayout><p className="text-gray-500 text-sm">Chargement...</p></CardLayout>}>
      <DesabonnementContent />
    </Suspense>
  );
}
