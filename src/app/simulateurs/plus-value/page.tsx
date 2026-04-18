import { FamilyLocked } from "@/components/simulateurs/FamilyLocked";

export default function PlusValue() {
  return (
    <FamilyLocked
      title="Simulateur plus-value immobilière"
      description="Estime l'impôt sur la plus-value lors de la revente, avec abattements IR et PS."
      teaserBullets={[
        "Abattements IR et prélèvements sociaux selon la durée de détention",
        "Calcul de l'impôt total et du net vendeur",
        "Prise en compte des travaux déductibles",
        "Comparaison de scénarios de revente",
      ]}
    />
  );
}
