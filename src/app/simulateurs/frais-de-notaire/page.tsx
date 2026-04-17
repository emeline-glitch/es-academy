"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

// Mapping villes -> départements pour les plus courantes
const VILLES_DEPARTEMENTS: Record<string, { dep: string; reduit: boolean }> = {
  "paris": { dep: "75", reduit: false },
  "marseille": { dep: "13", reduit: false },
  "lyon": { dep: "69", reduit: false },
  "toulouse": { dep: "31", reduit: false },
  "nice": { dep: "06", reduit: false },
  "nantes": { dep: "44", reduit: false },
  "montpellier": { dep: "34", reduit: false },
  "strasbourg": { dep: "67", reduit: false },
  "bordeaux": { dep: "33", reduit: false },
  "lille": { dep: "59", reduit: false },
  "rennes": { dep: "35", reduit: false },
  "reims": { dep: "51", reduit: false },
  "saint-etienne": { dep: "42", reduit: false },
  "toulon": { dep: "83", reduit: false },
  "le mans": { dep: "72", reduit: false },
  "aix-en-provence": { dep: "13", reduit: false },
  "brest": { dep: "29", reduit: false },
  "dijon": { dep: "21", reduit: false },
  "angers": { dep: "49", reduit: false },
  "rouen": { dep: "76", reduit: false },
  "tours": { dep: "37", reduit: false },
  "poitiers": { dep: "86", reduit: false },
  "guadeloupe": { dep: "971", reduit: true },
  "martinique": { dep: "972", reduit: true },
  "guyane": { dep: "973", reduit: true },
  "la reunion": { dep: "974", reduit: true },
  "mayotte": { dep: "976", reduit: true },
};

export default function FraisNotaire() {
  const [prix, setPrix] = useState(200000);
  const [type, setType] = useState<"ancien" | "neuf">("ancien");
  const [ville, setVille] = useState("");
  const [isReduit, setIsReduit] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  function markCalculated() {
    if (!hasCalculated) setHasCalculated(true);
  }

  // Détection automatique du taux
  function handleVilleChange(v: string) {
    setVille(v);
    markCalculated();
    const key = v.toLowerCase().trim();
    if (VILLES_DEPARTEMENTS[key]) {
      setIsReduit(VILLES_DEPARTEMENTS[key].reduit);
    } else {
      // Par défaut, taux standard (99% des cas en métropole)
      setIsReduit(false);
    }
  }

  const tauxDroits = type === "ancien" ? (isReduit ? 5.11 : 5.81) : 0.71;
  const droitsMutation = prix * tauxDroits / 100;
  const emoluments = Math.min(prix * 0.008, 4000) + 400;
  const debours = 800;
  const totalFrais = droitsMutation + emoluments + debours;
  const pourcentage = (totalFrais / prix) * 100;
  const coutTotal = prix + totalFrais;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Calcul des frais de notaire</h1>
          <p className="text-es-text-muted mb-8">Estime les frais de notaire pour ton achat immobilier</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Ton achat</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Prix d&apos;achat : <strong>{prix.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={50000} max={1000000} step={5000} value={prix} onChange={(e) => { setPrix(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Type de bien</label>
                    <div className="flex gap-2">
                      <button onClick={() => { setType("ancien"); markCalculated(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${type === "ancien" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>
                        Ancien
                      </button>
                      <button onClick={() => { setType("neuf"); markCalculated(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${type === "neuf" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>
                        Neuf (VEFA)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1.5 block">Ville du bien</label>
                    <input
                      type="text"
                      value={ville}
                      onChange={(e) => handleVilleChange(e.target.value)}
                      placeholder="Ex: Lyon, Paris, Marseille..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {isReduit
                        ? "🏝️ Département d'outre-mer — taux réduit (5.11%)"
                        : type === "ancien"
                          ? "📍 Métropole — taux standard (5.81%)"
                          : "🏗️ Neuf — droits réduits (0.71%)"}
                    </p>
                  </div>
                </div>
              </Card>
              <SimulateurDisclaimer />
            </div>

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <h3 className="text-white/60 text-sm mb-3">Résultat</h3>
                <div className="bg-white/10 rounded-xl p-5 text-center mb-4">
                  <div className="text-xs text-white/50 mb-1">Frais de notaire estimés ({pourcentage.toFixed(1)}%)</div>
                  <div className="text-4xl font-bold text-es-gold">{Math.round(totalFrais).toLocaleString("fr-FR")}€</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-xs text-white/50 mb-1">Coût total de l&apos;opération</div>
                  <div className="text-2xl font-bold">{Math.round(coutTotal).toLocaleString("fr-FR")}€</div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Détail des frais</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Droits de mutation ({tauxDroits}%)</span><span>{Math.round(droitsMutation).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Émoluments du notaire</span><span>{Math.round(emoluments).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Débours et formalités</span><span>{debours}€</span></div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between font-bold"><span>Total frais</span><span>{Math.round(totalFrais).toLocaleString("fr-FR")}€</span></div>
                </div>
              </Card>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800">
                💡 <strong>Astuce :</strong> Tu peux négocier les émoluments du notaire sur la partie au-dessus de 100 000€ (jusqu&apos;à -20%). Demande une remise !
              </div>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="frais-de-notaire"
            hasCalculated={hasCalculated}
            formInputs={{ prix, type, ville, isReduit }}
            formOutputs={{ droitsMutation, emoluments, debours, totalFrais, coutTotal, tauxDroits }}
            nextStepTitle="Les frais de notaire ne sont pas une fatalité."
            nextStepBody="3 astuces pour les réduire : négociation du mobilier, choix du type de bien, optimisation fiscale. On en parle ensemble."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
