"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/site-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = redirect;
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-es-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-es-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="font-serif text-xl font-bold text-gray-900 mb-1">ES Academy</h1>
        <p className="text-sm text-gray-500 mb-6">Site en cours de construction. Entrez le mot de passe pour accéder.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Mot de passe"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-center text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-es-green/30"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-3">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-es-green text-white rounded-lg font-medium text-sm hover:bg-es-green-light transition-colors cursor-pointer"
          >
            Accéder au site
          </button>
        </form>

        <p className="text-[10px] text-gray-300 mt-6">Emeline Siron - ES Academy</p>
      </div>
    </div>
  );
}

export default function SitePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    }>
      <PasswordForm />
    </Suspense>
  );
}
