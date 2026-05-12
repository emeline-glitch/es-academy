import { SITE_URL } from "@/lib/utils/constants";

const LOGO_URL = `${SITE_URL}/images/logo.svg`;
const SOCIAL_PROFILES = [
  "https://www.instagram.com/emeline.siron/",
  "https://www.linkedin.com/in/emeline-siron/",
  "https://www.youtube.com/@emeline.siron",
  "https://fr.trustpilot.com/review/emelinesiron.com",
];

/**
 * EducationalOrganization schema.
 *
 * Inclut address (Issy-les-Moulineaux) et contactPoint pour le Knowledge
 * Graph local. legalName = Holdem Groupe (entite juridique de l'editeur,
 * cf. memory project_holdem_groupe).
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}#organization`,
    name: "ES Academy : Emeline Siron",
    legalName: "Holdem Groupe",
    alternateName: "ES Academy",
    url: SITE_URL,
    logo: LOGO_URL,
    description: "Formation en investissement immobilier locatif. La méthode complète pour bâtir ton patrimoine.",
    founder: {
      "@type": "Person",
      name: "Emeline Siron",
      jobTitle: "Investisseuse immobiliere et formatrice",
      url: SITE_URL,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Issy-les-Moulineaux",
      postalCode: "92130",
      addressCountry: "FR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "contact@emeline-siron.fr",
      availableLanguage: ["French"],
      areaServed: "FR",
    },
    areaServed: "FR",
    sameAs: SOCIAL_PROFILES,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "447",
      bestRating: "5",
    },
  };
}

/**
 * Course schema dedie a /academy.
 *
 * Inclut hasCourseInstance avec courseMode "online" (eligible aux rich
 * snippets Google Course). Provider reference l'Organization par @id pour
 * eviter la duplication.
 */
export function courseSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_URL}/academy#course`,
    courseCode: "ES-ACADEMY-V1",
    name: "La Méthode Emeline Siron",
    description: "Formation complète en investissement immobilier locatif : 14 modules, 30h de vidéo, 60 outils pratiques.",
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "ES Academy : Emeline Siron",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "998",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/academy`,
      category: "Online Course",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT30H",
      inLanguage: "fr-FR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "447",
      bestRating: "5",
    },
    numberOfCredits: 14,
    educationalLevel: "Débutant à avancé",
    inLanguage: "fr",
  };
}

/**
 * Product schema pour /academy.
 *
 * Permet rich snippets prix + rating dans les SERP. Complémentaire au
 * courseSchema (Google accepte les deux ; Product pour la dimension
 * commerciale, Course pour la dimension pedagogique).
 */
export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/academy#product`,
    name: "ES Academy : La Méthode Emeline Siron",
    description: "Formation en ligne sur l'investissement immobilier locatif : 14 modules, 30h de vidéo, 60 outils, 3 mois ES Family inclus.",
    image: `${SITE_URL}/images/og-default.jpg`,
    brand: {
      "@type": "Brand",
      name: "ES Academy",
    },
    category: "Online Education",
    offers: {
      "@type": "Offer",
      price: "998",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/academy`,
      seller: {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "ES Academy",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "447",
      bestRating: "5",
    },
  };
}

export function articleSchema(article: {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  publishDate: string;
  featuredImage?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "ES Academy : Emeline Siron",
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    image: article.featuredImage || `${SITE_URL}/images/og-default.jpg`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * WebSite schema avec SearchAction.
 *
 * Permet d'apparaitre avec une "Sitelinks Search Box" sous le 1er resultat
 * Google quand on cherche "emeline siron". Boost reconnaissance de marque.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: "Emeline Siron",
    alternateName: "ES Academy",
    description: "Formation en investissement immobilier locatif et autofinancement",
    inLanguage: "fr-FR",
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "Emeline Siron",
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Person schema pour Emeline Siron.
 *
 * Aide Google a construire le Knowledge Graph (panneau a droite des SERP)
 * avec photo, bio, liens sociaux.
 */
export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}#emeline-siron`,
    name: "Emeline Siron",
    givenName: "Emeline",
    familyName: "Siron",
    jobTitle: "Real Estate Investor and Educator",
    description:
      "Investisseuse immobiliere depuis 2019, 55 locataires sous gestion. Fondatrice d'ES Academy (formation) et ES Family (communaute patrimoniale). Anciennement gestionnaire de fonds d'investissement immobilier.",
    image: `${SITE_URL}/images/emeline-siron.png`,
    url: SITE_URL,
    sameAs: SOCIAL_PROFILES,
    worksFor: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "ES Academy",
      url: SITE_URL,
    },
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Master gestion de patrimoine immobilier",
    },
    knowsAbout: [
      "Investissement immobilier locatif",
      "Autofinancement immobilier",
      "Rentabilite locative",
      "Strategie patrimoniale",
      "Negociation immobiliere",
      "Financement immobilier",
      "LMNP",
      "SCI",
    ],
  };
}

/**
 * PodcastSeries schema pour /podcast.
 *
 * Lien vers le site canonique du podcast (otb-podcast.fr) afin que Google
 * comprenne que la page /podcast est un teaser et la source canonique est
 * sur le domaine dedie.
 */
export function podcastSeriesSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "@id": `${SITE_URL}/podcast#series`,
    name: "Out of the Box, le podcast de l'investissement",
    description: "Chaque mardi, Emeline Siron interviewe entrepreneurs et investisseurs pour repenser ton rapport a l'argent, l'investissement et l'entrepreneuriat.",
    url: "https://otb-podcast.fr",
    inLanguage: "fr-FR",
    image: `${SITE_URL}/images/og-default.jpg`,
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}#emeline-siron`,
      name: "Emeline Siron",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "ES Academy",
    },
    webFeed: "https://otb-podcast.fr/rss.xml",
  };
}

/**
 * VideoObject schema reutilisable.
 *
 * A utiliser sur les pages avec hero video (ex: /academy si on integre une
 * video pitch). Sans embedUrl explicite, Google ne sait pas qu'il y a une
 * video et le rich snippet "video" ne s'affiche pas.
 */
export function videoObjectSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  embedUrl?: string;
  contentUrl?: string;
  duration?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    ...(video.embedUrl ? { embedUrl: video.embedUrl } : {}),
    ...(video.contentUrl ? { contentUrl: video.contentUrl } : {}),
    ...(video.duration ? { duration: video.duration } : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "ES Academy",
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },
  };
}
