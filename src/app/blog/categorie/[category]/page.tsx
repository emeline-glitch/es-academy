import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getArticlesByCategory } from "@/lib/notion/blog";
import { buildMetadata } from "@/lib/seo/metadata";

const CATEGORIES: Record<string, { label: string; description: string }> = {
  investissement: { label: "Investissement", description: "Articles sur l'investissement immobilier locatif : stratégies, rentabilité, marchés." },
  fiscalite: { label: "Fiscalité", description: "Optimisation fiscale immobilière : LMNP, SCI, déficit foncier, amortissements." },
  financement: { label: "Financement", description: "Crédit immobilier, financement sans apport, dossier bancaire, courtier." },
  patrimoine: { label: "Patrimoine", description: "Gestion et transmission de patrimoine, diversification, stratégies long terme." },
  strategie: { label: "Stratégie", description: "Stratégies avancées d'investissement : immeuble de rapport, colocation, division." },
};

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES[category.toLowerCase()];
  if (!cat) return {};
  return buildMetadata({
    title: `${cat.label} — Blog`,
    description: cat.description,
    path: `/blog/categorie/${category}`,
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = CATEGORIES[category.toLowerCase()];
  const categoryName = cat?.label || category;

  // Capitalize first letter for Notion query
  const notionCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  const articles = await getArticlesByCategory(notionCategory);

  return (
    <div className="min-h-screen bg-es-cream">
      <Header />

      <section className="bg-es-green py-16">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
            <Link href="/" className="hover:text-white/70">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white/70">Blog</Link>
            <span>/</span>
            <span className="text-white/60">{categoryName}</span>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-white">{categoryName}</h1>
          {cat && <p className="text-white/60 mt-2">{cat.description}</p>}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Category nav */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link href="/blog" className="px-4 py-2 rounded-full text-sm bg-white border border-es-cream-dark text-es-text-muted hover:bg-es-green hover:text-white transition-colors">
              Tous
            </Link>
            {Object.entries(CATEGORIES).map(([key, val]) => (
              <Link
                key={key}
                href={`/blog/categorie/${key}`}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  key === category.toLowerCase()
                    ? "bg-es-green text-white"
                    : "bg-white border border-es-cream-dark text-es-text-muted hover:bg-es-green hover:text-white"
                }`}
              >
                {val.label}
              </Link>
            ))}
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-es-cream-dark">
              <p className="text-es-text-muted">Aucun article dans cette catégorie pour le moment.</p>
              <Link href="/blog" className="text-es-green text-sm hover:underline mt-2 inline-block">
                ← Voir tous les articles
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-es-cream-dark card-hover group"
                >
                  <div className="aspect-[16/9] bg-es-cream-dark">
                    {article.featuredImage ? (
                      <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif text-2xl text-es-text-muted/30">ES</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-serif text-lg font-bold text-es-text group-hover:text-es-green transition-colors leading-snug mb-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-es-text-muted line-clamp-2 mb-4">{article.excerpt}</p>
                    <span className="text-xs text-es-text-muted/60">{formatDate(article.publishDate)}</span>
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
