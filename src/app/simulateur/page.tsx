"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SimulateurPage() {
  const [prixAchat, setPrixAchat] = useState(150000);
  const [fraisNotaire, setFraisNotaire] = useState(8);
  const [travaux, setTravaux] = useState(15000);
  const [loyerMensuel, setLoyerMensuel] = useState(800);
  const [charges, setCharges] = useState(150);
  const [taxeFonciere, setTaxeFonciere] = useState(100);
  const [dureeCredit, setDureeCredit] = useState(20);
  const [tauxCredit, setTauxCredit] = useState(3.5);

  const coutTotal = prixAchat + (prixAchat * fraisNotaire / 100) + travaux;
  const loyerAnnuel = loyerMensuel * 12;
  const chargesAnnuelles = (charges + taxeFonciere) * 12;
  const revenuNet = loyerAnnuel - chargesAnnuelles;
  const rendementBrut = (loyerAnnuel / coutTotal) * 100;
  const rendementNet = (revenuNet / coutTotal) * 100;

  // Mensualité crédit
  const tauxMensuel = tauxCredit / 100 / 12;
  const nbMois = dureeCredit * 12;
  const mensualite = coutTotal * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
  const cashflow = loyerMensuel - charges - taxeFonciere - mensualite;

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Outil gratuit</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-es-text mt-3 mb-3">
              Simulateur de rentabilité locative
            </h1>
            <p className="text-es-text-muted max-w-xl mx-auto">
              Calculez en 2 minutes si un bien est rentable. Rendement brut, net, cash-flow mensuel.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-5">
              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Le bien</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Prix d&apos;achat : <strong>{prixAchat.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={30000} max={500000} step={5000} value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Frais de notaire : <strong>{fraisNotaire}%</strong></label>
                    <input type="range" min={2} max={10} step={0.5} value={fraisNotaire} onChange={(e) => setFraisNotaire(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Travaux : <strong>{travaux.toLocaleString("fr-FR")}€</strong></label>
                    <input type="range" min={0} max={100000} step={1000} value={travaux} onChange={(e) => setTravaux(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Les revenus</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Loyer mensuel : <strong>{loyerMensuel}€</strong></label>
                    <input type="range" min={200} max={3000} step={50} value={loyerMensuel} onChange={(e) => setLoyerMensuel(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Charges mensuelles : <strong>{charges}€</strong></label>
                    <input type="range" min={0} max={500} step={10} value={charges} onChange={(e) => setCharges(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taxe foncière (mensuel) : <strong>{taxeFonciere}€</strong></label>
                    <input type="range" min={0} max={300} step={10} value={taxeFonciere} onChange={(e) => setTaxeFonciere(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium text-gray-900 mb-4">Le crédit</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Durée : <strong>{dureeCredit} ans</strong></label>
                    <input type="range" min={10} max={25} step={1} value={dureeCredit} onChange={(e) => setDureeCredit(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Taux : <strong>{tauxCredit}%</strong></label>
                    <input type="range" min={1} max={6} step={0.1} value={tauxCredit} onChange={(e) => setTauxCredit(Number(e.target.value))} className="w-full accent-es-green" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Results */}
            <div className="space-y-5">
              {/* Rendement brut — visible */}
              <div className="rounded-xl p-6 border-0" style={{ backgroundColor: "#2c6e55" }}>
                <h3 className="text-white/60 text-sm mb-4">Résultats</h3>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <div className="text-4xl font-bold" style={{ color: "#c4a35a" }}>{rendementBrut.toFixed(1)}%</div>
                  <div className="text-sm text-white/70 mt-1">Rendement brut</div>
                </div>
              </div>

              {/* Cadenas Family — résultats détaillés verrouillés */}
              <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "340px" }}>
                {/* Contenu flouté derrière */}
                <div className="blur-[6px] select-none pointer-events-none opacity-60 space-y-4" aria-hidden="true">
                  <Card className="bg-es-green text-white border-0">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-es-gold">{rendementNet.toFixed(1)}%</div>
                        <div className="text-[10px] text-white/50">Rendement net</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-green-300">+{Math.round(cashflow)}€</div>
                        <div className="text-[10px] text-white/50">Cash-flow/mois</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-white">{Math.round(mensualite)}€</div>
                        <div className="text-[10px] text-white/50">Mensualité</div>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Coût total</span><span>{Math.round(coutTotal).toLocaleString("fr-FR")}€</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Loyer annuel</span><span>{loyerAnnuel.toLocaleString("fr-FR")}€</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Charges</span><span className="text-red-500">-{chargesAnnuelles.toLocaleString("fr-FR")}€</span></div>
                      <div className="flex justify-between font-bold pt-2"><span>Cash-flow</span><span className="text-green-600">+{Math.round(cashflow)}€</span></div>
                    </div>
                  </Card>
                </div>

                {/* Overlay cadenas */}
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center px-6">
                  <div className="w-14 h-14 bg-es-green rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">Analyse complète</h3>
                  <p className="text-base font-bold text-es-green mb-1">Réservé aux adhérents Family</p>
                  <p className="text-xs text-gray-500 mb-5 max-w-xs">
                    Rendement net, cash-flow, mensualité et analyse personnalisée
                  </p>
                  <Button variant="primary" size="sm" href="/family">
                    Rejoindre ES Family
                  </Button>
                </div>
              </div>

              <div className="bg-es-green/5 rounded-xl p-6 border border-es-green/10 text-center">
                <p className="text-sm text-es-text-muted mb-4">
                  Tu veux apprendre à trouver des biens rentables et autofinancés ?
                </p>
                <Button variant="primary" href="/academy">
                  Découvrir la méthode complète →
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  ⚠️ Ce simulateur fournit une estimation indicative. Les résultats ne constituent ni un conseil en investissement, ni un engagement contractuel. Consulte un professionnel pour un calcul adapté à ta situation. Dernière mise à jour : avril 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
