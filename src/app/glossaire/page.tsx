import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Glossaire immobilier — Tous les termes à connaître",
  description: "Définitions simples de tous les termes de l'investissement immobilier : LMNP, SCI, cash-flow, rendement, DPE, et plus.",
  path: "/glossaire",
});

const glossary = [
  { term: "Amortissement", def: "Technique comptable qui permet de déduire la perte de valeur d'un bien meublé des revenus locatifs, réduisant ainsi l'impôt. Utilisé principalement en LMNP au régime réel." },
  { term: "Apport personnel", def: "Somme d'argent que l'emprunteur investit de ses propres fonds dans un projet immobilier. Certaines banques financent à 110% (sans apport)." },
  { term: "Autofinancement", def: "Situation où les loyers couvrent intégralement la mensualité de crédit et les charges. L'objectif de base de tout investissement locatif rentable." },
  { term: "Cash-flow", def: "Différence entre les loyers perçus et l'ensemble des dépenses (crédit, charges, impôts). Un cash-flow positif signifie que le bien génère un revenu net chaque mois." },
  { term: "Colocation", def: "Mode de location où plusieurs locataires partagent un même logement. Permet de maximiser les revenus locatifs par rapport à une location classique." },
  { term: "Compromis de vente", def: "Avant-contrat signé entre vendeur et acheteur, engageant les deux parties. L'acheteur dispose d'un délai de rétractation de 10 jours." },
  { term: "Déficit foncier", def: "Mécanisme fiscal permettant de déduire les charges (travaux, intérêts) supérieures aux revenus fonciers du revenu global, dans la limite de 10 700€/an." },
  { term: "Différé de remboursement", def: "Période pendant laquelle l'emprunteur ne rembourse que les intérêts (ou rien). Utile pendant une phase de travaux." },
  { term: "DPE", def: "Diagnostic de Performance Énergétique. Note de A à G évaluant la consommation énergétique d'un logement. Les passoires thermiques (F et G) sont progressivement interdites à la location." },
  { term: "Effet de levier", def: "Principe qui consiste à utiliser l'endettement bancaire pour acquérir un bien immobilier. Le crédit est remboursé par les loyers du locataire." },
  { term: "Frais de notaire", def: "Frais d'acquisition comprenant les droits de mutation, les émoluments du notaire et les débours. Environ 7-8% dans l'ancien, 2-3% dans le neuf." },
  { term: "Immeuble de rapport", def: "Immeuble entier composé de plusieurs lots loués séparément. Permet de mutualiser les coûts et d'obtenir un rendement supérieur." },
  { term: "LMNP", def: "Loueur Meublé Non Professionnel. Statut fiscal avantageux permettant d'amortir le bien et le mobilier, réduisant fortement l'imposition sur les loyers." },
  { term: "Location courte durée", def: "Location de type Airbnb, à la nuitée ou à la semaine. Rendement potentiellement élevé mais gestion plus intensive et réglementation stricte." },
  { term: "Mensualité", def: "Somme versée chaque mois à la banque pour rembourser le crédit immobilier, comprenant le capital et les intérêts." },
  { term: "Plus-value immobilière", def: "Gain réalisé lors de la revente d'un bien. Taxée à 19% (+ prélèvements sociaux), avec des abattements progressifs selon la durée de détention." },
  { term: "Rendement brut", def: "Ratio entre les loyers annuels et le prix d'achat du bien, exprimé en pourcentage. Formule : (loyer annuel / prix d'achat) × 100." },
  { term: "Rendement net", def: "Rendement tenant compte des charges, taxes et frais de gestion. Plus représentatif de la réalité que le rendement brut." },
  { term: "SCI", def: "Société Civile Immobilière. Structure juridique permettant d'acheter et gérer des biens à plusieurs, avec des avantages en matière de transmission et de gestion." },
  { term: "Scoring bancaire", def: "Note attribuée par la banque à un emprunteur en fonction de sa situation financière, professionnelle et patrimoniale. Détermine l'obtention et les conditions du crédit." },
  { term: "Taux d'endettement", def: "Ratio entre les charges de crédit mensuelles et les revenus nets. Les banques acceptent généralement jusqu'à 35%." },
  { term: "Taux d'usure", def: "Taux maximum légal auquel une banque peut prêter. Fixé chaque trimestre par la Banque de France." },
  { term: "Vacance locative", def: "Période pendant laquelle un bien n'est pas loué. À anticiper dans ses calculs de rentabilité (généralement 1 mois/an)." },
];

const letters = Array.from(new Set(glossary.map((g) => g.term[0].toUpperCase()))).sort();

export default function GlossairePage() {
  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="bg-es-green py-16">
        <div className="max-w-3xl mx-auto px-6">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Ressource gratuite</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-3">
            Glossaire de l&apos;immobilier
          </h1>
          <p className="text-white/60 mt-4">{glossary.length} termes expliqués simplement</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6">
          {/* Letter nav */}
          <div className="flex flex-wrap gap-2 mb-8 sticky top-16 bg-es-cream py-3 z-10">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-9 h-9 rounded-lg bg-white border border-es-cream-dark flex items-center justify-center text-sm font-bold text-es-green hover:bg-es-green hover:text-white transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>

          {/* Terms */}
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="mb-8">
              <h2 className="font-serif text-2xl font-bold text-es-green mb-4 scroll-mt-28">{letter}</h2>
              <div className="space-y-3">
                {glossary
                  .filter((g) => g.term[0].toUpperCase() === letter)
                  .map((g, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-es-cream-dark">
                      <h3 className="font-bold text-es-text mb-1">{g.term}</h3>
                      <p className="text-sm text-es-text-muted leading-relaxed">{g.def}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
