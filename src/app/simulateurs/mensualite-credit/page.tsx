"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SimulateurDisclaimer } from "@/components/simulateurs/Disclaimer";

export default function MensualiteCredit() {
  const [montant, setMontant] = useState(200000);
  const [duree, setDuree] = useState(20);
  const [taux, setTaux] = useState(3.5);
  const [assurance, setAssurance] = useState(0.34);

  const tauxM = taux / 100 / 12;
  const nbMois = duree * 12;
  const mensualiteHorsAss = montant * (tauxM * Math.pow(1 + tauxM, nbMois)) / (Math.pow(1 + tauxM, nbMois) - 1);
  const mensualiteAssurance = montant * assurance / 100 / 12;
  const mensualiteTotal = mensualiteHorsAss + mensualiteAssurance;
  const coutTotal = mensualiteTotal * nbMois;
  const coutInterets = coutTotal - montant;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/simulateurs" className="text-sm text-gray-400 hover:text-es-green mb-4 inline-block">← Tous les simulateurs</Link>
          <h1 className="font-serif text-3xl font-bold text-es-text mb-2">Calculateur de mensualité de crédit</h1>
          <p className="text-es-text-muted mb-8">Calculez votre mensualité en fonction du montant, taux et durée</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <h3 className="font-medium text-gray-900 mb-4">Votre crédit</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Montant emprunté : <strong>{montant.toLocaleString("fr-FR")}€</strong></label>
                  <input type="range" min={30000} max={800000} step={5000} value={montant} onChange={(e) => setMontant(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Durée : <strong>{duree} ans</strong></label>
                  <input type="range" min={5} max={25} step={1} value={duree} onChange={(e) => setDuree(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Taux d&apos;intérêt : <strong>{taux}%</strong></label>
                  <input type="range" min={0.5} max={7} step={0.1} value={taux} onChange={(e) => setTaux(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Assurance : <strong>{assurance}%</strong></label>
                  <input type="range" min={0} max={0.6} step={0.02} value={assurance} onChange={(e) => setAssurance(Number(e.target.value))} className="w-full accent-es-green" />
                </div>
              </div>
            </Card>
            <SimulateurDisclaimer />

            <div className="space-y-5">
              <Card className="bg-es-green text-white border-0">
                <h3 className="text-white/60 text-sm mb-4">Votre mensualité</h3>
                <div className="bg-white/10 rounded-xl p-5 text-center mb-4">
                  <div className="text-4xl font-bold text-es-gold">{Math.round(mensualiteTotal).toLocaleString("fr-FR")}€</div>
                  <div className="text-sm text-white/60 mt-1">par mois (assurance incluse)</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{Math.round(mensualiteHorsAss)}€</div>
                    <div className="text-[10px] text-white/60">Hors assurance</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{Math.round(mensualiteAssurance)}€</div>
                    <div className="text-[10px] text-white/60">Assurance</div>
                  </div>
                </div>
              </Card>
              <Card>
                <h3 className="font-medium text-gray-900 mb-3">Coût total du crédit</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Capital emprunté</span><span>{montant.toLocaleString("fr-FR")}€</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Intérêts</span><span className="text-red-500">{Math.round(coutInterets).toLocaleString("fr-FR")}€</span></div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between font-bold"><span>Coût total</span><span>{Math.round(coutTotal).toLocaleString("fr-FR")}€</span></div>
                </div>
              </Card>
              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">Apprenez à négocier le meilleur taux avec votre banquier.</p>
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
