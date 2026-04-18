import { FamilyLocked } from "@/components/simulateurs/FamilyLocked";

export default function ImpotsLocation() {
  return (
    <FamilyLocked
      title="Simulateur impôts sur les loyers"
      description="Estime tes impôts selon le régime fiscal : micro-foncier, réel, LMNP, location nue."
      teaserBullets={[
        "Comparaison instantanée Micro vs Réel",
        "Amortissement LMNP pour réduire ton imposable",
        "Calcul impôt sur le revenu + prélèvements sociaux",
        "Identification du régime fiscal optimal pour ta situation",
      ]}
    />
  );
}
