import ThankYouSeasonal from "@/components/landings/ThankYouSeasonal";

export const metadata = {
  title: "Inscription confirmee | Cahier de vacances investisseur",
};

export default function CahierVacancesMerciPage() {
  return (
    <ThankYouSeasonal
      emoji="🏖️"
      title="Ton cahier arrive bientot dans ta boite mail"
      body="Tu vas recevoir le 1er email avec le PDF du cahier. Ensuite, un email par jour pendant 7 jours pour t'aider a passer chaque etape avec moi."
    />
  );
}
