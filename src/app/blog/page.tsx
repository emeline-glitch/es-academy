import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getPublishedArticles } from "@/lib/notion/blog";
import { getBlogImageMap } from "@/lib/notion/blog-images";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "Blog — Investissement immobilier & patrimoine",
  description: "Articles, guides et conseils sur l'investissement immobilier locatif, la fiscalité, la gestion de patrimoine et les stratégies rentables.",
  path: "/blog",
});

export const revalidate = 3600;

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const [articles, imageMap] = await Promise.all([
    getPublishedArticles(),
    getBlogImageMap(),
  ]);

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Blog", url: `${SITE_URL}/blog` },
      ])} />

      {/* Hero */}
      <section className="bg-es-green py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Blog</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-3">
              Investissement immobilier &amp; patrimoine
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Guides, analyses et conseils pour bâtir et piloter ton patrimoine immobilier.
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          {articles.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-es-cream-dark">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-es-green/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-es-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-bold text-es-text mb-2">Les articles arrivent bientôt</h2>
              <p className="text-es-text-muted text-sm max-w-md mx-auto">
                Le blog sera alimenté depuis Notion. Chaque article publié apparaîtra automatiquement ici.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-es-cream-dark card-hover group"
                >
                  {/* Image (Notion FeaturedImage si dispo, sinon photo Unsplash thématique selon la catégorie) */}
                  <div className="aspect-[16/9] bg-es-cream-dark relative overflow-hidden">
                    <img
                      src={imageMap.get(article.slug) || article.featuredImage || ""}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {article.category && (
                      <span className="absolute top-3 left-3 bg-es-green text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h2 className="font-serif text-lg font-bold text-es-text group-hover:text-es-green transition-colors leading-snug mb-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-es-text-muted line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-es-text-muted/60">
                      <span>{article.author}</span>
                      <span>{formatDate(article.publishDate)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
