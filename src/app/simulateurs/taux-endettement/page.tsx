"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

export default function TauxEndettement() {
  const [revenus, setRevenus] = useState(3500);
  const [creditExistant, setCreditExistant] = useState(400);
  const [nouvelleMensualite, setNouvelleMensualite] = useState(600);
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleChange = (setter: (v: number) => void) => (v: number) => {
    setter(v);
    if (!hasCalculated) setHasCalculated(true);
  };

  const totalCharges = creditExistant + nouvelleMensualite;
  const tauxActuel = (creditExistant / revenus) * 100;
  const tauxApres = (totalCharges / revenus) * 100;
  const resteAVivre = revenus - totalCharges;
  const ok = tauxApres <= 35;
  const tauxEndettement = tauxApres;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Calculateur taux d&apos;endettement</h1>
          <p className="text-es-text-muted mb-8">Vérifie si tu respectes la limite des 35%</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Revenus nets mensuels : <strong>{revenus.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={1000} max={15000} step={100} value={revenus} onChange={(e) => handleChange(setRevenus)(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Crédits existants : <strong>{creditExistant}€/mois</strong></label>
                  <input type="range" min={0} max={3000} step={50} value={creditExistant} onChange={(e) => handleChange(setCreditExistant)(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nouvelle mensualité : <strong>{nouvelleMensualite}€/mois</strong></label>
                  <input type="range" min={100} max={3000} step={50} value={nouvelleMensualite} onChange={(e) => handleChange(setNouvelleMensualite)(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
              </div>
            </Card>
            <SimulateurDisclaimer />

            <div className="space-y-5">
              <Card className={`${ok ? "bg-emerald-600" : "bg-red-600"} text-white border-0 shadow-xl`}>
                <h3 className="text-white/70 text-sm mb-3 font-medium">Ton taux d&apos;endettement</h3>
                <div className="bg-white/15 rounded-xl p-6 text-center mb-4">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-3xl" aria-hidden>{ok ? "✅" : "⚠️"}</span>
                    <div className="text-5xl sm:text-6xl font-bold text-white leading-none">{tauxApres.toFixed(1)}%</div>
                  </div>
                  <div className="text-white/70 text-sm mt-2">après ton nouveau projet</div>
                </div>
                <div className="text-center px-4 py-3 rounded-xl text-sm font-semibold bg-white/20 text-white">
                  {ok ? "Tu es dans les clous (max 35%)" : "Au-dessus de 35% : refus probable"}
                </div>
              </Card>
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Endettement actuel</span><span>{tauxActuel.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Endettement après projet</span><span className={`font-bold ${ok ? "text-green-600" : "text-red-600"}`}>{tauxApres.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Reste à vivre</span><span>{resteAVivre.toLocaleString("fr-FR")}€/mois</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Limite légale</span><span className="font-bold">35%</span></div>
                </div>
              </Card>
              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Au-dessus de 35% ? Découvre les astuces pour optimiser ton dossier bancaire.</p>
                <Button variant="primary" href="/academy">Voir la méthode →</Button>
              </div>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="taux-endettement"
            hasCalculated={hasCalculated}
            formInputs={{ revenus, creditExistant, nouvelleMensualite }}
            formOutputs={{ tauxActuel, tauxApres, resteAVivre, ok }}
            nextStepTitle={`Tu es à ${tauxEndettement.toFixed(1)}% d'endettement ?`}
            nextStepBody="Découvre les solutions pour emprunter au-delà des 35% : holding, présentation de dossier, stratégies d'empilement. On en discute ensemble."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
