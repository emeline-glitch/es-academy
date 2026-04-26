import ThankYouSeasonal from "@/components/landings/ThankYouSeasonal";

export const metadata = {
  title: "Inscription confirmee | Calendrier de l'Avent investisseur",
};

export default function CalendrierAventMerciPage() {
  return (
    <ThankYouSeasonal
      emoji="🎄"
      title="Tu es inscrite au calendrier !"
      body="Le 1er decembre, tu recevras le 1er email du calendrier. D'ici la, tu peux deja jeter un oeil au reste de la formation pour preparer 2027."
    />
  );
}
