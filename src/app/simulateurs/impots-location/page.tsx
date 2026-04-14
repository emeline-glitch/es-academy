"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";

export default function ImpotsLocation() {
  const [loyerAnnuel, setLoyerAnnuel] = useState(9600);
  const [regime, setRegime] = useState<"micro" | "reel">("micro");
  const [typeLocation, setTypeLocation] = useState<"nue" | "meublee">("meublee");
  const [chargesDeductibles, setChargesDeductibles] = useState(3000);
  const [amortissement, setAmortissement] = useState(5000);
  const [tmi, setTmi] = useState(30);

  const abattementMicro = typeLocation === "meublee" ? 50 : 30;
  let revenuImposable: number;
  let prelevementsSociaux: number;
  let impotRevenu: number;

  if (regime === "micro") {
    revenuImposable = loyerAnnuel * (1 - abattementMicro / 100);
    impotRevenu = revenuImposable * tmi / 100;
    prelevementsSociaux = revenuImposable * 0.172;
  } else {
    const deductions = chargesDeductibles + (typeLocation === "meublee" ? amortissement : 0);
    revenuImposable = Math.max(0, loyerAnnuel - deductions);
    impotRevenu = revenuImposable * tmi / 100;
    prelevementsSociaux = revenuImposable * 0.172;
  }

  const totalImpot = impotRevenu + prelevementsSociaux;
  const tauxImposition = loyerAnnuel > 0 ? (totalImpot / loyerAnnuel) * 100 : 0;
  const revenuNet = loyerAnnuel - totalImpot;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Simulateur impôts sur les loyers</h1>
          <p className="text-es-text-muted mb-8">Estimez vos impôts selon le régime fiscal choisi</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Type de location</h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setTypeLocation("meublee")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${typeLocation === "meublee" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>Meublée (LMNP)</button>
                  <button onClick={() => setTypeLocation("nue")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${typeLocation === "nue" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>Location nue</button>
                </div>
                <h3 className="font-medium text-gray-900 mb-4">Régime fiscal</h3>
                <div className="flex gap-2">
                  <button onClick={() => setRegime("micro")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${regime === "micro" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>
                    Micro ({abattementMicro}% abattement)
                  </button>
                  <button onClick={() => setRegime("reel")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${regime === "reel" ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>Réel</button>
                </div>
              </Card>
              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Loyers annuels : <strong>{loyerAnnuel.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={2000} max={50000} step={200} value={loyerAnnuel} onChange={(e) => setLoyerAnnuel(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Tranche marginale (TMI) : <strong>{tmi}%</strong></label>
                    <div className="flex gap-2">
                      {[0, 11, 30, 41, 45].map((t) => (
                        <button key={t} onClick={() => setTmi(t)} className={`flex-1 py-2 rounded text-xs font-medium cursor-pointer ${tmi === t ? "bg-es-green text-white" : "bg-gray-100 text-gray-600"}`}>{t}%</button>
                      ))}
                    </div>
                  </div>
                  {regime === "reel" && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Charges déductibles : <strong>{chargesDeductibles.toLocaleString("fr-FR")}€</strong></label>
                        <input type="range" min={0} max={20000} step={500} value={chargesDeductibles} onChange={(e) => setChargesDeductibles(Number(e.target.value))} className="w-full accent-es-green" />
                      </div>
                      {typeLocation === "meublee" && (
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Amortissement annuel : <strong>{amortissement.toLocaleString("fr-FR")}€</strong></label>
                          <input type="range" min={0} max={15000} step={500} value={amortissement} onChange={(e) => setAmortissement(Number(e.target.value))} className="w-full accent-es-green" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
              <SimulateurDisclaimer />
            </div>

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-300">{Math.round(totalImpot).toLocaleString("fr-FR")}€</div>
                    <div className="text-xs text-white/60">Impôt total / an</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-es-gold">{Math.round(revenuNet).toLocaleString("fr-FR")}€</div>
                    <div className="text-xs text-white/60">Revenu net / an</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold">{tauxImposition.toFixed(1)}%</div>
                  <div className="text-xs text-white/60">Taux d&apos;imposition effectif</div>
                </div>
              </Card>
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Loyers bruts</span><span>{loyerAnnuel.toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Revenu imposable</span><span>{Math.round(revenuImposable).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IR ({tmi}%)</span><span className="text-red-500">{Math.round(impotRevenu).toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Prélèvements sociaux (17.2%)</span><span className="text-red-500">{Math.round(prelevementsSociaux).toLocaleString("fr-FR")}€</span></div>
                </div>
              </Card>
              {regime === "micro" && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800">
                  💡 En passant au régime réel, vous pourriez réduire significativement vos impôts grâce aux charges déductibles et à l&apos;amortissement.
                </div>
              )}
              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Le Module 9 de la formation vous apprend à ne pas payer d&apos;impôts sur vos loyers.</p>
                <Button variant="primary" href="/academy">Voir la méthode →</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
