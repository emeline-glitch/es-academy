"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface FormConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  success_message: string;
  background_image_url: string | null;
  require_phone: boolean;
  require_last_name: boolean;
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [form, setForm] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const fetchForm = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${slug}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setForm(data.form);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchForm();
  }, [slug, fetchForm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !firstName || !consent) {
      setError("Merci de remplir les champs obligatoires.");
      return;
    }
    if (form?.require_phone && !phone) {
      setError("Téléphone requis.");
      return;
    }
    if (form?.require_last_name && !lastName) {
      setError("Nom requis.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          consent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur");
        setSubmitting(false);
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Erreur serveur — réessaie plus tard.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-es-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen bg-es-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-3">🔍</p>
          <h1 className="font-serif text-xl font-bold text-es-text mb-2">Formulaire introuvable</h1>
          <p className="text-sm text-es-text-muted">
            Ce formulaire n&apos;existe pas ou n&apos;est plus en ligne. Vérifie le lien, ou retourne sur{" "}
            <a href="/" className="text-es-green hover:underline">emeline-siron.fr</a>.
          </p>
        </div>
      </div>
    );
  }

  const bgStyle: React.CSSProperties = {};
  if (form.background_image_url) {
    bgStyle.backgroundImage = `url(${form.background_image_url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else {
    bgStyle.backgroundColor = "#F5F0E8";
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-10" style={bgStyle}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-es-green/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-es-text mb-3">C&apos;est confirmé !</h1>
          <p className="text-sm text-es-text-muted whitespace-pre-wrap">{form.success_message}</p>
          <a
            href="/"
            className="inline-block mt-6 text-sm text-es-green hover:underline font-medium"
          >
            Retourner sur le site →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={bgStyle}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="font-serif text-2xl font-bold text-es-text text-center mb-2 leading-tight">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-sm text-es-text-muted text-center mb-6">{form.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom *"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
          />

          {form.require_last_name && (
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom *"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
          />

          {form.require_phone && (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone *"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
            />
          )}

          <label className="flex items-start gap-2 text-xs text-gray-600 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 accent-es-green"
            />
            <span>
              J&apos;accepte de recevoir les emails et j&apos;ai pris connaissance de la{" "}
              <a href="/politique-confidentialite" target="_blank" className="text-es-green hover:underline">politique de confidentialité</a>. *
            </span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-es-green text-white font-semibold py-3 rounded-lg hover:bg-es-green-light transition-colors disabled:opacity-50 mt-2"
          >
            {submitting ? "Envoi…" : "S'inscrire"}
          </button>

          <p className="text-[10px] text-gray-400 text-center pt-2 italic">
            Tu peux te désinscrire à tout moment via le lien présent dans chaque email.
          </p>
        </form>
      </div>
    </div>
  );
}
