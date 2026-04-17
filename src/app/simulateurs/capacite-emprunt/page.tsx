"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

export default function CapaciteEmprunt() {
  const [revenus, setRevenus] = useState(3500);
  const [charges, setCharges] = useState(500);
  const [duree, setDuree] = useState(20);
  const [taux, setTaux] = useState(3.5);
  const [apport, setApport] = useState(0);
  const [hasCalculated, setHasCalculated] = useState(false);

  function markCalculated() {
    if (!hasCalculated) setHasCalculated(true);
  }

  const capaciteMensuelle = (revenus - charges) * 0.35;
  const tauxM = taux / 100 / 12;
  const nbMois = duree * 12;
  const capaciteEmprunt = capaciteMensuelle * (1 - Math.pow(1 + tauxM, -nbMois)) / tauxM;
  const budgetTotal = capaciteEmprunt + apport;
  const montantMax = budgetTotal;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Simulateur de capacité d&apos;emprunt</h1>
          <p className="text-es-text-muted mb-8">Combien peux-tu emprunter pour ton projet immobilier ?</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Tes revenus</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Revenus nets mensuels : <strong>{revenus.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={1000} max={15000} step={100} value={revenus} onChange={(e) => { setRevenus(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Charges mensuelles (crédits en cours) : <strong>{charges}€</strong></label>
                    <input type="range" min={0} max={3000} step={50} value={charges} onChange={(e) => { setCharges(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Apport personnel : <strong>{apport.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={0} max={200000} step={5000} value={apport} onChange={(e) => { setApport(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Le crédit</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Durée : <strong>{duree} ans</strong></label>
                    <input type="range" min={10} max={25} step={1} value={duree} onChange={(e) => { setDuree(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taux : <strong>{taux}%</strong></label>
                    <input type="range" min={1} max={6} step={0.1} value={taux} onChange={(e) => { setTaux(Number(e.target.value)); markCalculated(); }} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>
              <SimulateurDisclaimer />
            </div>

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <h3 className="text-white/60 text-sm mb-4">Ta capacité</h3>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-5 text-center">
                    <div className="text-4xl font-bold text-es-gold">{Math.round(budgetTotal).toLocaleString("fr-FR")}€</div>
                    <div className="text-sm text-white/60 mt-1">Budget total (emprunt + apport)</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{Math.round(capaciteEmprunt).toLocaleString("fr-FR")}€</div>
                      <div className="text-xs text-white/60 mt-1">Emprunt max</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{Math.round(capaciteMensuelle)}€</div>
                      <div className="text-xs text-white/60 mt-1">Mensualité max</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Détail du calcul</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Revenus nets</span><span>{revenus.toLocaleString("fr-FR")}€/mois</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Charges existantes</span><span className="text-red-500">-{charges}€/mois</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Reste à vivre</span><span>{(revenus - charges - capaciteMensuelle).toLocaleString("fr-FR")}€/mois</span></div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between"><span className="text-gray-500">Taux d&apos;endettement</span><span className="font-bold">35% (max légal)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Durée du prêt</span><span>{duree} ans ({duree * 12} mois)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Taux d&apos;intérêt</span><span>{taux}%</span></div>
                </div>
              </Card>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="capacite-emprunt"
            hasCalculated={hasCalculated}
            formInputs={{ revenus, charges, duree, taux, apport }}
            formOutputs={{ capaciteMensuelle, capaciteEmprunt, budgetTotal }}
            nextStepTitle={`Tu peux emprunter ${Math.round(montantMax).toLocaleString("fr-FR")}€ ? Voici les stratégies pour décupler ton budget avec du locatif intelligent.`}
            nextStepBody="On analyse ensemble ton profil d'emprunteur et les leviers pour augmenter ta capacité (investissements décotés, structures juridiques, stratégies d'empilement)."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
