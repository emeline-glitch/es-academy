"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";
import { SimulatorCapture } from "@/components/simulateurs/SimulatorCapture";

export default function PlusValue() {
  const [prixAchat, setPrixAchat] = useState(150000);
  const [prixVente, setPrixVente] = useState(200000);
  const [dureeDetention, setDureeDetention] = useState(5);
  const [travaux, setTravaux] = useState(10000);
  const [hasCalculated, setHasCalculated] = useState(false);

  const plusValueBrute = prixVente - prixAchat - travaux - (prixAchat * 0.075); // 7.5% frais forfaitaires
  const abattementIR = dureeDetention >= 22 ? 100 : dureeDetention >= 6 ? (dureeDetention - 5) * 6 : 0;
  const abattementPS = dureeDetention >= 30 ? 100 : dureeDetention >= 6 ? Math.min((dureeDetention - 5) * 1.65, 100) : 0;
  const pvImposableIR = Math.max(0, plusValueBrute * (1 - abattementIR / 100));
  const pvImposablePS = Math.max(0, plusValueBrute * (1 - abattementPS / 100));
  const impotIR = pvImposableIR * 0.19;
  const prelevementsSociaux = pvImposablePS * 0.172;
  const taxeSupp = pvImposableIR > 50000 ? pvImposableIR * 0.06 : 0;
  const totalImpot = Math.max(0, impotIR + prelevementsSociaux + taxeSupp);
  const netVendeur = prixVente - totalImpot;
  const plusValueNette = Math.max(0, plusValueBrute) - totalImpot;

  useEffect(() => {
    if (!hasCalculated) setHasCalculated(true);
    // On déclenche au premier changement d'input ou montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prixAchat, prixVente, dureeDetention, travaux]);

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Simulateur plus-value immobilière</h1>
          <p className="text-es-text-muted mb-8">Estime l&apos;impôt sur la plus-value lors de la revente</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Prix d&apos;achat : <strong>{prixAchat.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={30000} max={500000} step={5000} value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Prix de vente : <strong>{prixVente.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={30000} max={800000} step={5000} value={prixVente} onChange={(e) => setPrixVente(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Durée de détention : <strong>{dureeDetention} ans</strong></label>
                  <input type="range" min={0} max={30} step={1} value={dureeDetention} onChange={(e) => setDureeDetention(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Travaux réalisés : <strong>{travaux.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={0} max={100000} step={1000} value={travaux} onChange={(e) => setTravaux(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
              </div>
            </Card>
            <SimulateurDisclaimer />

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <h3 className="text-white/60 text-sm mb-3">Résultat</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-xs text-white/50 mb-1">Plus-value brute</div>
                    <div className="text-2xl font-bold text-es-gold">{Math.round(Math.max(0, plusValueBrute)).toLocaleString("fr-FR")}€</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-xs text-white/50 mb-1">Impôt total</div>
                    <div className="text-2xl font-bold text-red-300">{Math.round(totalImpot).toLocaleString("fr-FR")}€</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-5 text-center mt-3">
                  <div className="text-3xl font-bold text-es-gold">{Math.round(netVendeur).toLocaleString("fr-FR")}€</div>
                  <div className="text-xs text-white/60 mt-1">Net vendeur après impôt</div>
                </div>
              </Card>
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Abattement IR</span><span>{abattementIR.toFixed(0)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Abattement PS</span><span>{abattementPS.toFixed(0)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IR (19%)</span><span>{Math.round(impotIR).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Prélèvements sociaux (17.2%)</span><span>{Math.round(prelevementsSociaux).toLocaleString("fr-FR")}€</span></div>
                  {dureeDetention >= 22 && <p className="text-xs text-green-600 font-medium">✅ Exonéré d&apos;IR après 22 ans</p>}
                  {dureeDetention >= 30 && <p className="text-xs text-green-600 font-medium">✅ Exonéré total après 30 ans</p>}
                </div>
              </Card>
              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Apprends à optimiser la fiscalité de tes reventes immobilières.</p>
                <Button variant="primary" href="/academy">Voir la méthode →</Button>
              </div>
            </div>
          </div>

          <SimulatorCapture
            simulatorType="plus-value"
            hasCalculated={hasCalculated}
            formInputs={{ prixAchat, prixVente, dureeDetention, travaux }}
            formOutputs={{
              plusValueBrute: Math.max(0, plusValueBrute),
              totalImpot,
              netVendeur,
              plusValueNette,
              abattementIR,
              abattementPS,
            }}
            nextStepTitle={`Ta plus-value nette sera de ${Math.round(plusValueNette).toLocaleString("fr-FR")}€ ?`}
            nextStepBody="Voici les stratégies pour l'optimiser : démembrement, SCI à l'IS, timing de revente, travaux déductibles. On en parle ensemble."
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
