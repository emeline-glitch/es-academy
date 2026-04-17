"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

export default function AcheterOuLouer() {
  const [prixBien, setPrixBien] = useState(250000);
  const [loyerActuel, setLoyerActuel] = useState(900);
  const [tauxCredit, setTauxCredit] = useState(3.5);
  const [apport, setApport] = useState(25000);
  const [valorisation, setValorisation] = useState(2);
  const [hasCalculated, setHasCalculated] = useState(false);

  const fraisNotaire = prixBien * 0.08;
  const coutAchat = prixBien + fraisNotaire;
  const emprunt = coutAchat - apport;
  const tauxM = tauxCredit / 100 / 12;
  const mensualite = emprunt * (tauxM * Math.pow(1 + tauxM, 240)) / (Math.pow(1 + tauxM, 240) - 1);
  const chargesProprietaire = prixBien * 0.015 / 12; // 1.5% charges annuelles
  const coutMensuelProprio = mensualite + chargesProprietaire;

  // Calcul du seuil de rentabilité
  let anneeRentable = 0;
  let coutCumulLocation = 0;
  let coutCumulAchat = apport + fraisNotaire;
  const loyerMensuelAvecAugmentation = (annee: number) => loyerActuel * Math.pow(1.02, annee);

  for (let a = 1; a <= 30; a++) {
    coutCumulLocation += loyerMensuelAvecAugmentation(a) * 12;
    coutCumulAchat += coutMensuelProprio * 12;
    const valeurBien = prixBien * Math.pow(1 + valorisation / 100, a);
    const patrimoineAchat = valeurBien - (a <= 20 ? emprunt * (1 - a / 20) : 0);
    const patrimoineLocation = coutCumulLocation; // argent "perdu"

    if (patrimoineAchat > coutCumulAchat && anneeRentable === 0) {
      anneeRentable = a;
    }
  }

  const patrimoine20ans = prixBien * Math.pow(1 + valorisation / 100, 20);
  const loyerPerdu20ans = Array.from({ length: 20 }, (_, i) => loyerMensuelAvecAugmentation(i + 1) * 12).reduce((a, b) => a + b, 0);
  const anneesRentableLabel = anneeRentable > 0 ? `${anneeRentable}` : "30+";

  useEffect(() => {
    if (!hasCalculated) setHasCalculated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixBien, loyerActuel, tauxCredit, apport, valorisation]);

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Acheter ou louer ?</h1>
          <p className="text-es-text-muted mb-8">Au bout de combien d&apos;années acheter devient plus rentable ?</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Prix du bien : <strong>{prixBien.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={80000} max={600000} step={10000} value={prixBien} onChange={(e) => setPrixBien(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Loyer actuel : <strong>{loyerActuel}€/mois</strong></label>
                  <input type="range" min={300} max={2500} step={50} value={loyerActuel} onChange={(e) => setLoyerActuel(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Apport : <strong>{apport.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={0} max={200000} step={5000} value={apport} onChange={(e) => setApport(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Taux crédit : <strong>{tauxCredit}%</strong></label>
                  <input type="range" min={1} max={6} step={0.1} value={tauxCredit} onChange={(e) => setTauxCredit(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Valorisation annuelle : <strong>{valorisation}%</strong></label>
                  <input type="range" min={0} max={5} step={0.5} value={valorisation} onChange={(e) => setValorisation(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
              </div>
            </Card>
            <SimulateurDisclaimer />

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <div className="text-center">
                  <div className="text-5xl font-bold text-es-gold mb-2">
                    {anneeRentable > 0 ? `${anneeRentable} ans` : "30+ ans"}
                  </div>
                  <div className="text-white/60">pour que l&apos;achat soit rentable vs la location</div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-es-green/5 border-es-green/20 text-center">
                  <div className="text-2xl font-bold text-es-green">{Math.round(coutMensuelProprio)}€</div>
                  <div className="text-xs text-gray-500 mt-1">Coût mensuel propriétaire</div>
                </Card>
                <Card className="bg-es-terracotta/5 border-es-terracotta/20 text-center">
                  <div className="text-2xl font-bold text-es-terracotta">{loyerActuel}€</div>
                  <div className="text-xs text-gray-500 mt-1">Loyer mensuel</div>
                </Card>
              </div>

              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Sur 20 ans</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Valeur du bien</span><span className="text-green-600 font-bold">{Math.round(patrimoine20ans).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Loyers &quot;perdus&quot; en location</span><span className="text-red-500">{Math.round(loyerPerdu20ans).toLocaleString("fr-FR")}€</span></div>
                </div>
              </Card>

              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Et si ton locataire payait ton crédit à ta place ? C&apos;est le principe de l&apos;investissement locatif.</p>
                <Button variant="primary" href="/academy">Découvrir la méthode →</Button>
              </div>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="acheter-ou-louer"
            hasCalculated={hasCalculated}
            formInputs={{ prixBien, loyerActuel, tauxCredit, apport, valorisation }}
            formOutputs={{
              anneeRentable,
              mensualite,
              coutMensuelProprio,
              patrimoine20ans,
              loyerPerdu20ans,
            }}
            nextStepTitle={`Dans ton cas, acheter devient rentable à partir de ${anneesRentableLabel} ans.`}
            nextStepBody="Mais tu peux changer la donne en louant ton bien à d'autres : colocation, courte durée, division. On voit ensemble ce qui s'adapte à ton projet."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
