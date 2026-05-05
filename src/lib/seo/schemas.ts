import { SITE_URL } from "@/lib/utils/constants";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "ES Academy : Emeline Siron",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.svg`,
    description: "Formation en investissement immobilier locatif. La méthode complète pour bâtir ton patrimoine.",
    founder: {
      "@type": "Person",
      name: "Emeline Siron",
      jobTitle: "Formatrice en investissement immobilier",
    },
    areaServed: "FR",
    sameAs: [
      "https://www.instagram.com/emeline.siron/",
      "https://fr.trustpilot.com/review/emelinesiron.com",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "447",
      bestRating: "5",
    },
  };
}

export function courseSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "La Méthode Emeline Siron",
    description: "Formation complète en investissement immobilier locatif : 14 modules, 30h de vidéo, 60 outils pratiques.",
    provider: {
      "@type": "Organization",
      name: "ES Academy : Emeline Siron",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "998",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/academy`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT30H",
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
        url: `${SITE_URL}/images/logo.svg`,
      },
    },
    datePublished: article.publishDate,
    image: article.featuredImage || `${SITE_URL}/images/og-default.jpg`,
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
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
    url: SITE_URL,
    name: "Emeline Siron",
    alternateName: "ES Academy",
    description: "Formation en investissement immobilier locatif et autofinancement",
    inLanguage: "fr-FR",
    publisher: {
      "@type": "Organization",
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
    jobTitle: "Investisseuse immobiliere et formatrice",
    description:
      "Investisseuse immobiliere depuis 2019, 55 locataires sous gestion. Fondatrice d'ES Academy (formation) et ES Family (communaute patrimoniale). Anciennement gestionnaire de fonds d'investissement immobilier.",
    image: `${SITE_URL}/images/emeline-siron.png`,
    url: SITE_URL,
    sameAs: [
      "https://www.instagram.com/emeline.siron/",
      "https://www.linkedin.com/in/emeline-siron/",
      "https://www.youtube.com/@emeline.siron",
      "https://fr.trustpilot.com/review/emelinesiron.com",
    ],
    worksFor: {
      "@type": "Organization",
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
