import ThankYouSeasonal from "@/components/landings/ThankYouSeasonal";

export const metadata = {
  title: "Inscription confirmee | Chasse aux oeufs immo",
};

export default function ChasseOeufsMerciPage() {
  return (
    <ThankYouSeasonal
      emoji="🥚"
      title="Tu es inscrite a la chasse !"
      body="Le 1er email arrivera le matin du jour J. D'ici la, prepare-toi a jouer : 7 jours, 7 surprises et un cadeau final pour les finishers."
    />
  );
}
