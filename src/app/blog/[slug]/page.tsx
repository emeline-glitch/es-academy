import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getArticleBySlug, getArticleBlocks, getPublishedArticles } from "@/lib/notion/blog";
import { getBlogImage, getBlogImageMap } from "@/lib/notion/blog-images";
import { renderBlocks } from "@/lib/notion/renderer";
import { buildMetadata } from "@/lib/seo/metadata";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { SITE_URL } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";

export const revalidate = 3600;

export async function generateStaticParams() {
  const articles = await getPublishedArticles(100);
  return articles
    .filter((a) => a.slug)
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return buildMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    path: `/blog/${article.slug}`,
    image: await getBlogImage(article),
    type: "article",
    publishedTime: article.publishDate,
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const blocks = await getArticleBlocks(article.id);
  const imageMap = await getBlogImageMap();
  const articleImage = imageMap.get(article.slug) || article.featuredImage || "";

  // Get related articles
  const allArticles = await getPublishedArticles(10);
  const related = allArticles
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <JsonLd data={[
        articleSchema(article),
        breadcrumbSchema([
          { name: "Accueil", url: SITE_URL },
          { name: "Blog", url: `${SITE_URL}/blog` },
          { name: article.title, url: `${SITE_URL}/blog/${article.slug}` },
        ]),
      ]} />

      {/* Hero */}
      <section className="bg-es-green py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
            <Link href="/" className="hover:text-white/70">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white/70">Blog</Link>
            <span>/</span>
            <span className="text-white/60 truncate">{article.title}</span>
          </nav>
          {article.category && (
            <span className="inline-block bg-es-gold/20 text-es-gold text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full mb-4">
              {article.category}
            </span>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
            {article.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
            <span>{article.author}</span>
            <span>·</span>
            <span>{formatDate(article.publishDate)}</span>
          </div>
        </div>
      </section>

      {/* Featured image (Notion FeaturedImage si dispo, sinon photo Unsplash thématique) */}
      <div className="max-w-4xl mx-auto px-6 -mt-6">
        <img
          src={articleImage}
          alt={article.title}
          className="w-full rounded-xl shadow-lg"
        />
      </div>

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose-es">
          <ArticleContent
            relatedArticles={allArticles.map((a) => ({
              title: a.title,
              slug: a.slug,
            }))}
          >
            {renderBlocks(blocks as Parameters<typeof renderBlocks>[0])}
          </ArticleContent>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-es-cream-dark flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="bg-es-cream px-3 py-1 rounded-full text-xs text-es-text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-es-green rounded-2xl p-8 text-center text-white">
          <h3 className="font-serif text-xl font-bold mb-2">Envie d&apos;aller plus loin ?</h3>
          <p className="text-white/70 text-sm mb-6">Découvrez la méthode complète pour investir en immobilier locatif.</p>
          <Button variant="cta" className="btn-gold-shimmer" href="/academy">
            Découvrir ES Academy →
          </Button>
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="py-16 bg-es-cream">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-serif text-2xl font-bold text-es-text mb-8">Articles similaires</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((a) => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-es-cream-dark card-hover group"
                >
                  <div className="aspect-[16/9] bg-es-cream-dark">
                    <img
                      src={imageMap.get(a.slug) || a.featuredImage || ""}
                      alt={a.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-es-text group-hover:text-es-green transition-colors leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-xs text-es-text-muted mt-2">{formatDate(a.publishDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
