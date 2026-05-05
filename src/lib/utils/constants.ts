export const SITE_NAME = "Emeline Siron";
export const SITE_DESCRIPTION =
  "Construisons ta réussite financière et humaine. ES Academy : formation immobilier locatif. ES Family : communauté patrimoniale.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://emeline-siron.fr";

// Taux de crédit moyen : à mettre à jour chaque mois
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
    name: "La Méthode Emeline Siron",
    price: 998,
    priceDisplay: "998",
    currency: "EUR",
    features: [
      "Formation vidéo 30h + supports téléchargeables",
      "60 outils de l'investisseur (calculateurs, modèles, checklists)",
      "3 mois ES Family offerts",
      "Accès illimité si formation terminée en 3 mois",
      "Module bonus : interviews de professionnels",
      "Session mentorat collective mensuelle",
      "Mises à jour et replays des lives",
      "Fichier de partenaires immobiliers",
    ],
  },
  coaching: {
    name: "Coaching sur mesure",
    description: "Accompagnement individualisé selon ton profil et tes objectifs",
  },
  family: {
    name: "ES Family",
    priceFondateur: 19,
    priceStandard: 29,
    currency: "EUR",
    placesTotal: 500,
    placesRestantes: 312,
    features: [
      "Mini analyses vidéo flash (annonces immo, villes, actifs alternatifs)",
      "Lives mensuels + replays (Emeline + partenaires experts)",
      "Ebooks mensuels (marchés, villes, tendances patrimoniales)",
      "Opportunités exclusives (montres, art, vin, private deals)",
      "Sous-groupes thématiques (LMNP, Airbnb, SCPI, actifs alternatifs, networking)",
      "Annuaire membres + mise en réseau",
      "Challenges gamifiés et classement membres",
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
    title: "Être un investisseur intelligent et rentable",
    items: ["Améliorer son mindset", "Prérequis financiers", "Étapes d'un investissement", "Définir son projet"],
  },
  {
    number: 2,
    title: "Utiliser les meilleures stratégies de location",
    items: ["Colocation haut rendement", "Immeuble de rapport", "Location courte durée", "Locaux commerciaux", "Division", "Achat-revente RP", "Sous-location professionnelle"],
  },
  {
    number: 3,
    title: "Trouver des biens rentables avant les autres",
    items: ["Définir budget et secteur", "Traquer les bonnes affaires", "Étude de marché d'une ville rentable"],
  },
  {
    number: 4,
    title: "Obtenir des revenus complémentaires",
    items: ["Indicateurs financiers", "Business plan", "Critères Go / No Go"],
  },
  {
    number: 5,
    title: "Visiter et négocier avec brio",
    items: ["Check-list visites", "Exemple terrain", "Diagnostics immobiliers", "Techniques de négociation", "Notaire et formalités"],
  },
  {
    number: 6,
    title: "Décrocher un crédit sans apport",
    items: ["Types de crédits", "Analyse des offres", "Dossier bancaire", "Enchaîner les crédits", "Crowdfunding"],
  },
  {
    number: 7,
    title: "Devenir expert de la rénovation",
    items: ["Choisir une entreprise", "Comparer les devis", "Comprendre les travaux", "Suivi de chantier", "Réception et garanties", "Urbanisme"],
  },
  {
    number: 8,
    title: "Louer sans impayé ni vacance",
    items: ["Trouver le bon locataire", "Déléguer la gestion", "Types de baux", "Cautionnement", "Assurances", "Copropriété"],
  },
  {
    number: 9,
    title: "Ne pas payer d'impôts sur les loyers",
    items: ["Imposition des particuliers", "Location nue et meublée", "Taxes locales", "Plus-values", "Obligations déclaratives"],
  },
  {
    number: 10,
    title: "Vivre de la SCI",
    items: ["Achat en société", "Création", "Rémunération dirigeant", "Bilan et résultats", "Imposition avantageuse", "Étude de cas"],
  },
  {
    number: 11,
    title: "Optimiser la transmission de son patrimoine",
    items: ["Holding", "Démembrement", "Droit des successions", "Régimes matrimoniaux"],
  },
  {
    number: 12,
    title: "Toutes les astuces pour réussir dans le locatif",
    items: ["Déléguer à distance", "Maîtriser les risques", "Augmenter le cash-flow", "Enchaîner les investissements", "Outils"],
  },
  {
    number: 13,
    title: "FAQ de l'immobilier",
    items: ["Financement et banque", "Travaux et gestion locative", "Fiscalité et sociétés"],
  },
  {
    number: 14,
    title: "Investir sans jamais être bloqué",
    items: ["Trouver un associé", "SCI à l'IS", "Marketing produit", "Interviews de professionnels"],
  },
] as const;
