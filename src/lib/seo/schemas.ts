import { SITE_URL } from "@/lib/utils/constants";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "ES Academy — Emeline Siron",
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
      name: "ES Academy — Emeline Siron",
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
      name: "ES Academy — Emeline Siron",
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
