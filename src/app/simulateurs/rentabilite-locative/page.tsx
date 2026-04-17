"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

export default function RentabiliteLocative() {
  const [prixAchat, setPrixAchat] = useState(150000);
  const [fraisNotaire, setFraisNotaire] = useState(8);
  const [travaux, setTravaux] = useState(15000);
  const [loyerMensuel, setLoyerMensuel] = useState(800);
  const [charges, setCharges] = useState(150);
  const [taxeFonciere, setTaxeFonciere] = useState(100);
  const [dureeCredit, setDureeCredit] = useState(20);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (!hasCalculated) setHasCalculated(true);
  };

  const coutTotal = prixAchat + (prixAchat * fraisNotaire / 100) + travaux;
  const loyerAnnuel = loyerMensuel * 12;
  const chargesAnnuelles = (charges + taxeFonciere) * 12;
  const revenuNet = loyerAnnuel - chargesAnnuelles;
  const rendementBrut = (loyerAnnuel / coutTotal) * 100;
  const rendementNet = (revenuNet / coutTotal) * 100;

  const tauxMensuel = tauxCredit / 100 / 12;
  const nbMois = dureeCredit * 12;
  const mensualite = coutTotal * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
  const cashflow = loyerMensuel - charges - taxeFonciere - mensualite;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Simulateur de rentabilité locative</h1>
          <p className="text-es-text-muted mb-8">Calcule en 2 minutes si ton bien est rentable. Rendement brut, net, cash-flow mensuel.</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Le bien</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Prix d&apos;achat : <strong>{prixAchat.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={30000} max={500000} step={5000} value={prixAchat} onChange={(e) => handleChange(setPrixAchat)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Frais de notaire : <strong>{fraisNotaire}%</strong></label>
                    <input type="range" min={2} max={10} step={0.5} value={fraisNotaire} onChange={(e) => handleChange(setFraisNotaire)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Travaux : <strong>{travaux.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={0} max={100000} step={1000} value={travaux} onChange={(e) => handleChange(setTravaux)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Tes revenus</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Loyer mensuel : <strong>{loyerMensuel}€</strong></label>
                    <input type="range" min={200} max={3000} step={50} value={loyerMensuel} onChange={(e) => handleChange(setLoyerMensuel)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Charges mensuelles : <strong>{charges}€</strong></label>
                    <input type="range" min={0} max={500} step={10} value={charges} onChange={(e) => handleChange(setCharges)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taxe foncière (mensuel) : <strong>{taxeFonciere}€</strong></label>
                    <input type="range" min={0} max={300} step={10} value={taxeFonciere} onChange={(e) => handleChange(setTaxeFonciere)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Le crédit</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Durée : <strong>{dureeCredit} ans</strong></label>
                    <input type="range" min={10} max={25} step={1} value={dureeCredit} onChange={(e) => handleChange(setDureeCredit)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taux : <strong>{tauxCredit}%</strong></label>
                    <input type="range" min={1} max={6} step={0.1} value={tauxCredit} onChange={(e) => handleChange(setTauxCredit)(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>
              <SimulateurDisclaimer />
            </div>

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <h3 className="text-white/60 text-sm mb-4">Tes résultats</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-es-gold">{rendementBrut.toFixed(1)}%</div>
                    <div className="text-[10px] text-white/50">Rendement brut</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-es-gold">{rendementNet.toFixed(1)}%</div>
                    <div className="text-[10px] text-white/50">Rendement net</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-bold ${cashflow >= 0 ? "text-green-300" : "text-red-300"}`}>{cashflow >= 0 ? "+" : ""}{Math.round(cashflow)}€</div>
                    <div className="text-[10px] text-white/50">Cash-flow/mois</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold">{Math.round(mensualite).toLocaleString("fr-FR")}€</div>
                  <div className="text-xs text-white/60">Mensualité de crédit</div>
                </div>
              </Card>

              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Coût total</span><span>{Math.round(coutTotal).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Loyer annuel</span><span>{loyerAnnuel.toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Charges annuelles</span><span className="text-red-500">-{chargesAnnuelles.toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Revenu net annuel</span><span>{revenuNet.toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between font-bold pt-2"><span>Cash-flow mensuel</span><span className={cashflow >= 0 ? "text-green-600" : "text-red-600"}>{cashflow >= 0 ? "+" : ""}{Math.round(cashflow)}€</span></div>
                </div>
              </Card>

              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Tu veux apprendre à trouver des biens avec un cash-flow positif ?</p>
                <Button variant="primary" href="/academy">Découvrir la méthode →</Button>
              </div>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="rentabilite-locative"
            hasCalculated={hasCalculated}
            formInputs={{ prixAchat, fraisNotaire, travaux, loyerMensuel, charges, taxeFonciere, dureeCredit, tauxCredit }}
            formOutputs={{ rendementBrut, rendementNet, cashflow, mensualite, coutTotal }}
            nextStepTitle={`Ta rentabilité est de ${rendementNet.toFixed(1)}% ?`}
            nextStepBody="Voici comment passer de 4% à 7% sans changer de bien : leviers travaux, optimisation fiscale, colocation ou coliving. On en parle ensemble."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
