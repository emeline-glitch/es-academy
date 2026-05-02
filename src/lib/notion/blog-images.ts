import { cache } from "react";
import type { Article } from "./blog";
import { getPublishedArticles } from "./blog";

/**
 * Pools de photos Unsplash thématiques par catégorie d'article.
 * Toutes les URLs ont été vérifiées HTTP 200 (2026-04-29).
 *
 * Stratégie :
 *  1. Si l'article Notion a une FeaturedImage : on prend cette image (priorité absolue)
 *  2. Sinon : on prend une photo dans le pool de SA catégorie, à un index unique
 *     calculé par tri alphabétique des slugs au sein de la catégorie
 *
 * Garantie d'unicité : tant que pool[catégorie].length >= nb articles dans la catégorie,
 * aucun article n'a la même photo qu'un autre.
 *
 * Distribution actuelle (50 articles, 5 catégories) :
 *  - Investissement : 31 articles → pool 36 photos archi/immo/villes/intérieurs
 *  - Financement : 7 articles → pool 9 photos banque/finance/contrat
 *  - Strategie : 6 articles → pool 11 photos cosy/laptop/livre/work
 *  - Fiscalite : 5 articles → pool 6 photos calcul/papiers/droit
 *  - Patrimoine : 1 article → réutilise pool finance (graphiques/analyses)
 */
const UNSPLASH = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=85&auto=format&fit=crop`;

// Pool ARCHITECTURE / IMMOBILIER / VILLES — pour categorie "Investissement"
const POOL_ARCHITECTURE: string[] = [
  UNSPLASH("1560518883-ce09059eeffa"),
  UNSPLASH("1564013799919-ab600027ffc6"),
  UNSPLASH("1568605114967-8130f3a36994"),
  UNSPLASH("1493809842364-78817add7ffb"),
  UNSPLASH("1486406146926-c627a92ad1ab"),
  UNSPLASH("1582407947304-fd86f028f716"),
  UNSPLASH("1564182842519-8a3b2af3e228"),
  UNSPLASH("1554995207-c18c203602cb"),
  UNSPLASH("1467987506553-8f3916508521"),
  UNSPLASH("1502672260266-1c1ef2d93688"),
  UNSPLASH("1556909114-f6e7ad7d3136"),
  UNSPLASH("1494526585095-c41746248156"),
  UNSPLASH("1542621334-a254cf47733d"),
  UNSPLASH("1448630360428-65456885c650"),
  UNSPLASH("1505843795480-5cfb3c03f6ff"),
  UNSPLASH("1502920917128-1aa500764cbd"),
  UNSPLASH("1431576901776-e539bd916ba2"),
  UNSPLASH("1557804506-669a67965ba0"),
  UNSPLASH("1518391846015-55a9cc003b25"),
  UNSPLASH("1495020689067-958852a7765e"),
  UNSPLASH("1486325212027-8081e485255e"),
  UNSPLASH("1480714378408-67cf0d13bc1b"),
  UNSPLASH("1518131672697-613becd4fab5"),
  UNSPLASH("1517999144091-3d9dca6d1e43"),
  UNSPLASH("1502005229762-cf1b2da7c5d6"),
  UNSPLASH("1484154218962-a197022b5858"),
  UNSPLASH("1493663284031-b7e3aefcae8e"),
  UNSPLASH("1494203484021-3c454daf695d"),
  UNSPLASH("1531973576160-7125cd663d86"),
  UNSPLASH("1486718448742-163732cd1544"),
  UNSPLASH("1599809275671-b5942cabc7a2"),
  UNSPLASH("1494891848038-7bd202a2afeb"),
  UNSPLASH("1483478550801-ceba5fe50e8e"),
  UNSPLASH("1604014237800-1c9102c219da"),
  UNSPLASH("1487958449943-2429e8be8625"),
  UNSPLASH("1499951360447-b19be8fe80f5"),
  UNSPLASH("1503387837-b154d5074bd2"),
];

// Pool FINANCE / CALCUL / PAPIERS / GRAPHIQUES / DESK — pour "Fiscalite", "Financement", "Patrimoine"
// Agrandi a 14 photos (13 articles partagent ce pool : 1 Patrimoine + 5 Fiscalite + 7 Financement)
const POOL_FINANCE: string[] = [
  UNSPLASH("1554224155-6726b3ff858f"),
  UNSPLASH("1554224155-1696413565d3"),
  UNSPLASH("1611974789855-9c2a0a7236a3"),
  UNSPLASH("1554224154-26032ffc0d07"),
  UNSPLASH("1551836022-d5d88e9218df"),
  UNSPLASH("1565514020179-026b92b84bb6"),
  UNSPLASH("1542435503-956c469947f6"),
  UNSPLASH("1551260627-fd1b6daa6224"),
  // Photos desk/work additionnelles (transferees de POOL_STRATEGIE)
  UNSPLASH("1454165804606-c3d57bc86b40"),
  UNSPLASH("1517245386807-bb43f82c33c4"),
  UNSPLASH("1529539795054-3c162aab037a"),
  UNSPLASH("1518186285589-2f7649de83e0"),
  UNSPLASH("1517048676732-d65bc937f952"),
  UNSPLASH("1521791136064-7986c2920216"),
];

// Pool COSY / LAPTOP / LIVRES / WORK — pour "Strategie" (15 photos pour 6 articles)
const POOL_STRATEGIE: string[] = [
  UNSPLASH("1505691938895-1758d7feb511"),
  UNSPLASH("1556761175-5973dc0f32e7"),
  UNSPLASH("1497091071254-cc9b2ba7c48a"),
  UNSPLASH("1453928582365-b6ad33cbcf64"),
  UNSPLASH("1517694712202-14dd9538aa97"),
  UNSPLASH("1527689368864-3a821dbccc34"),
  UNSPLASH("1521737711867-e3b97375f902"),
  UNSPLASH("1455390582262-044cdead277a"),
  UNSPLASH("1500530855697-b586d89ba3ee"),
  UNSPLASH("1545324418-cc1a3fa10c00"),
  UNSPLASH("1462899006636-339e08d1844e"),
  UNSPLASH("1497366216548-37526070297c"),
  UNSPLASH("1492321936769-b49830bc1d1e"),
  UNSPLASH("1556761175-b413da4baf72"),
];

// Mapping categorie → pool. Si une categorie est absente, on utilise architecture (immo).
const CATEGORY_POOL: Record<string, string[]> = {
  Investissement: POOL_ARCHITECTURE,
  Patrimoine: POOL_FINANCE,
  Fiscalite: POOL_FINANCE,
  Financement: POOL_FINANCE,
  Strategie: POOL_STRATEGIE,
};

const FALLBACK_IMAGE = UNSPLASH("1486406146926-c627a92ad1ab");

/**
 * Construit le mapping slug → image pour TOUS les articles publies.
 * Pour chaque categorie, trie les articles par slug et assigne pool[i].
 * Garantit unicite au sein d'une meme categorie (et donc globalement, car les
 * pools sont disjoints).
 *
 * Cache pour la duree de la requete (React cache()) afin d'eviter de re-fetch
 * tous les articles a chaque appel sur une meme page rendue.
 */
export const getBlogImageMap = cache(async (): Promise<Map<string, string>> => {
  const articles = await getPublishedArticles(200);

  // Group by category
  const byCategory = new Map<string, Article[]>();
  for (const article of articles) {
    const cat = article.category || "Investissement";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(article);
  }

  // Compteur GLOBAL par pool (et non par categorie) : si plusieurs categories
  // partagent le meme pool (ex: POOL_FINANCE pour Fiscalite + Financement + Patrimoine),
  // l'index n'est pas reinitialise entre categories, donc pas de collision.
  const poolCounters = new Map<string[], number>();

  const map = new Map<string, string>();
  for (const [cat, list] of byCategory) {
    const pool = CATEGORY_POOL[cat] || POOL_ARCHITECTURE;
    if (!poolCounters.has(pool)) poolCounters.set(pool, 0);

    const sorted = [...list].sort((a, b) => a.slug.localeCompare(b.slug));
    for (const article of sorted) {
      if (article.featuredImage) {
        map.set(article.slug, article.featuredImage);
        continue;
      }
      const idx = poolCounters.get(pool)!;
      map.set(article.slug, pool[idx % pool.length]);
      poolCounters.set(pool, idx + 1);
    }
  }
  return map;
});

/**
 * Retourne l'URL d'image a afficher pour un article :
 *  - Notion FeaturedImage si Tiffany a uploade
 *  - Sinon photo Unsplash unique attribuee dans le pool de la categorie
 *  - Fallback si pool vide
 */
export async function getBlogImage(
  article: Pick<Article, "featuredImage" | "slug">
): Promise<string> {
  if (article.featuredImage) return article.featuredImage;
  const map = await getBlogImageMap();
  return map.get(article.slug) || FALLBACK_IMAGE;
}
