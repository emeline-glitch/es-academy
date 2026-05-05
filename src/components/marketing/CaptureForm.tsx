"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent, ConversionEvents } from "@/lib/analytics/gtm";

interface CaptureFormProps {
  title?: string;
  description?: string;
  buttonText?: string;
  tag?: string;
  className?: string;
  variant?: "inline" | "card";
}

export function CaptureForm({
  title = "Recois tes outils gratuits",
  description = "Simulateur de rentabilite, checklist visite, et guide du premier achat. Directement dans ta boite mail.",
  buttonText = "Recevoir les outils",
  className = "",
  variant = "card",
}: CaptureFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "capture_form" }),
      });
      if (res.ok) {
        trackEvent(ConversionEvents.LEAD_MAGNET_OPTIN, { source: "capture_form" });
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-es-success/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-es-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <h3 className="font-serif text-xl font-bold text-es-text mb-2">C&apos;est envoye !</h3>
        <p className="text-es-text-muted">Verifie ta boite mail (et tes spams).</p>
      </div>
    );
  }

  const wrapperStyles =
    variant === "card"
      ? "bg-es-white rounded-2xl border border-es-cream-dark p-8 shadow-sm"
      : "";

  return (
    <div className={`${wrapperStyles} ${className}`}>
      <h3 className="font-serif text-xl font-bold text-es-text mb-2">{title}</h3>
      <p className="text-es-text-muted mb-6 text-sm">{description}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          required
          className="flex-1 px-4 py-3 rounded-lg border border-es-cream-dark bg-es-cream-light text-es-text placeholder:text-es-text-muted/50 focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green transition-all"
        />
        <Button type="submit" variant="primary" disabled={status === "loading"}>
          {status === "loading" ? "..." : buttonText}
        </Button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-sm text-es-error">Une erreur est survenue. Reessaie.</p>
      )}
    </div>
  );
}
