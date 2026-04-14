export const SITE_NAME = "Emeline Siron";
export const SITE_DESCRIPTION =
  "Construisons votre reussite financiere et humaine. ES Academy : formation immobilier locatif. ES Family : communaute patrimoniale.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";

// Taux de crédit moyen — à mettre à jour chaque mois
// Source : observatoire-credit-logement.fr
export const TAUX_CREDIT_MOYEN = {
  "10ans": 3.10,
  "15ans": 3.25,
  "20ans": 3.35,
  "25ans": 3.45,
  miseAJour: "Avril 2026",
} as const;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contact@emelinesiron.com";

export const PRICING = {
  academy: {
    name: "La Methode Emeline Siron",
    price: 998,
    priceDisplay: "998",
    currency: "EUR",
    features: [
      "Formation video 30h + supports telechargeables",
      "60 outils de l'investisseur (calculateurs, modeles, checklists)",
      "3 mois ES Family offerts",
      "Acces illimite si formation terminee en 3 mois",
      "Module bonus — interviews de professionnels",
      "Session mentorat collective mensuelle",
      "Mises a jour et replays des lives",
      "Fichier de partenaires immobiliers",
    ],
  },
  coaching: {
    name: "Coaching sur mesure",
    description: "Accompagnement individualise selon votre profil et vos objectifs",
  },
  family: {
    name: "ES Family",
    priceFondateur: 19,
    priceStandard: 29,
    currency: "EUR",
    placesTotal: 500,
    placesRestantes: 312,
    features: [
      "Mini analyses video flash (annonces immo, villes, actifs alternatifs)",
      "Lives mensuels + replays (Emeline + partenaires experts)",
      "Ebooks mensuels (marches, villes, tendances patrimoniales)",
      "Opportunites exclusives (montres, art, vin, private deals)",
      "Sous-groupes thematiques (LMNP, Airbnb, SCPI, actifs alternatifs, networking)",
      "Annuaire membres + mise en reseau",
      "Challenges gamifies et classement membres",
    ],
  },
} as const;

export const STATS = {
  participants: 1900,
  satisfaction: 98,
  videoHours: 30,
  tools: 60,
  modules: 14,
  trustpilotScore: 4.9,
  trustpilotReviews: 447,
  googleScore: 4.9,
  googleReviews: 243,
} as const;

export const NAV_ITEMS = [
  { label: "ES Academy", href: "/academy" },
  { label: "ES Family", href: "/family" },
  { label: "Partenaires", href: "/academy#partenaires" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/emeline.siron/",
  trustpilot: "https://fr.trustpilot.com/review/emelinesiron.com",
  podcast: "https://podcast.emelinesiron.com",
} as const;

export const MODULES_PROGRAMME = [
  {
    number: 1,
    title: "Etre un investisseur intelligent et rentable",
    items: ["Ameliorer son mindset", "Prerequis financiers", "Etapes d'un investissement", "Definir son projet"],
  },
  {
    number: 2,
    title: "Utiliser les meilleures strategies de location",
    items: ["Colocation haut rendement", "Immeuble de rapport", "Location courte duree", "Locaux commerciaux", "Division", "Achat-revente RP", "Sous-location professionnelle"],
  },
  {
    number: 3,
    title: "Trouver des biens rentables avant les autres",
    items: ["Definir budget et secteur", "Traquer les bonnes affaires", "Etude de marche d'une ville rentable"],
  },
  {
    number: 4,
    title: "Obtenir des revenus complementaires",
    items: ["Indicateurs financiers", "Business plan", "Criteres Go / No Go"],
  },
  {
    number: 5,
    title: "Visiter et negocier avec brio",
    items: ["Check-list visites", "Exemple terrain", "Diagnostics immobiliers", "Techniques de negociation", "Notaire et formalites"],
  },
  {
    number: 6,
    title: "Decrocher un credit sans apport",
    items: ["Types de credits", "Analyse des offres", "Dossier bancaire", "Enchainer les credits", "Crowdfunding"],
  },
  {
    number: 7,
    title: "Devenir expert de la renovation",
    items: ["Choisir une entreprise", "Comparer les devis", "Comprendre les travaux", "Suivi de chantier", "Reception et garanties", "Urbanisme"],
  },
  {
    number: 8,
    title: "Louer sans impaye ni vacance",
    items: ["Trouver le bon locataire", "Deleguer la gestion", "Types de baux", "Cautionnement", "Assurances", "Copropriete"],
  },
  {
    number: 9,
    title: "Ne pas payer d'impots sur les loyers",
    items: ["Imposition des particuliers", "Location nue et meublee", "Taxes locales", "Plus-values", "Obligations declaratives"],
  },
  {
    number: 10,
    title: "Vivre de la SCI",
    items: ["Achat en societe", "Creation", "Remuneration dirigeant", "Bilan et resultats", "Imposition avantageuse", "Etude de cas"],
  },
  {
    number: 11,
    title: "Optimiser la transmission de son patrimoine",
    items: ["Holding", "Demembrement", "Droit des successions", "Regimes matrimoniaux"],
  },
  {
    number: 12,
    title: "Toutes les astuces pour reussir dans le locatif",
    items: ["Deleguer a distance", "Maitriser les risques", "Augmenter le cash-flow", "Enchainer les investissements", "Outils"],
  },
  {
    number: 13,
    title: "FAQ de l'immobilier",
    items: ["Financement et banque", "Travaux et gestion locative", "Fiscalite et societes"],
  },
  {
    number: 14,
    title: "Investir sans jamais etre bloque",
    items: ["Trouver un associe", "SCI a l'IS", "Marketing produit", "Interviews de professionnels"],
  },
] as const;
