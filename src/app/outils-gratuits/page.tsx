"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const tools = [
  {
    icon: "📊",
    title: "Simulateur de rentabilité locative",
    desc: "Calculez en 2 minutes si un bien est rentable. Rendement brut, net, cash-flow mensuel.",
  },
  {
    icon: "✅",
    title: "Checklist visite — 47 points de contrôle",
    desc: "Ne ratez plus rien lors d'une visite. Toiture, électricité, humidité, copropriété...",
  },
  {
    icon: "📖",
    title: "Guide : financer sans apport (PDF)",
    desc: "Les 7 techniques pour obtenir un prêt à 110%. Comment monter un dossier bancaire en béton.",
  },
];

export default function OutilsGratuits() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          source: "outils_gratuits",
          tags: ["lead_magnet", "outils_gratuits"],
        }),
      });
      if (res.ok) {
        window.location.href = "/merci-outils";
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — value proposition */}
            <div>
              <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Gratuit</span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mt-3 mb-4 leading-tight">
                3 outils indispensables pour votre premier investissement
              </h1>
              <p className="text-es-text-muted mb-8 leading-relaxed">
                Recevez gratuitement les outils que j&apos;utilise moi-même pour analyser, visiter et financer mes biens immobiliers.
              </p>

              <div className="space-y-5">
                {tools.map((tool, i) => (
                  <ScrollReveal key={i} delay={i * 100}>
                    <div className="flex gap-4 bg-white rounded-xl p-5 border border-es-cream-dark">
                      <span className="text-2xl shrink-0">{tool.icon}</span>
                      <div>
                        <h3 className="font-medium text-es-text text-sm mb-1">{tool.title}</h3>
                        <p className="text-xs text-es-text-muted">{tool.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-es-cream-dark">
              <h2 className="font-serif text-xl font-bold text-es-text mb-2">
                Recevez vos outils gratuits
              </h2>
              <p className="text-sm text-es-text-muted mb-6">
                Remplissez le formulaire et recevez tout dans votre boîte mail en 2 minutes.
              </p>

              {status === "error" && (
                <div className="bg-red-50 text-red-800 text-sm rounded-lg p-3 mb-4">
                  Une erreur est survenue. Réessayez.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-es-text mb-1.5 block">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-3 rounded-xl border border-es-cream-dark bg-es-cream-light text-es-text placeholder:text-es-text-muted/40 focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-es-text mb-1.5 block">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-es-cream-dark bg-es-cream-light text-es-text placeholder:text-es-text-muted/40 focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-es-green text-white font-semibold py-3.5 rounded-xl hover:bg-es-green-light transition-all cursor-pointer disabled:opacity-50"
                >
                  {status === "loading" ? "Envoi..." : "Recevoir mes outils gratuits →"}
                </button>
                <p className="text-[10px] text-es-text-muted/50 text-center">
                  Pas de spam. Désabonnement en 1 clic. Vos données sont protégées.
                </p>
              </form>

              <div className="mt-6 pt-5 border-t border-es-cream-dark flex items-center gap-4 text-xs text-es-text-muted">
                <div className="flex items-center gap-1">
                  <span className="text-es-terracotta">★★★★★</span>
                  <span>4.9/5</span>
                </div>
                <span>·</span>
                <span>1 900+ participants</span>
                <span>·</span>
                <span>Gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
