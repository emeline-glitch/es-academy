import { FamilyLocked } from "@/components/simulateurs/FamilyLocked";

export default function RentabiliteLocative() {
  return (
    <FamilyLocked
      title="Simulateur de rentabilité locative"
      description="Calcule rendement brut, rendement net et cash-flow mensuel en 2 minutes."
      teaserBullets={[
        "Rendement brut et net calculés automatiquement",
        "Cash-flow mensuel après crédit et charges",
        "Analyse de sensibilité : taux, durée, travaux",
        "Historique de tes simulations sauvegardées",
      ]}
    />
  );
}
