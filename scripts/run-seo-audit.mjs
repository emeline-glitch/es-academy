#!/usr/bin/env node
/**
 * Lance un audit SEO initial sans passer par le serveur Next.js.
 * One-shot : duplique la logique de src/lib/seo/audit.ts pour la run en local
 * avec les vars d'env de .env.local. Pratique avant le premier deploiement.
 *
 * Usage : node scripts/run-seo-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// Charger .env.local
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Pas de .env.local trouve");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnv();

const SUPABASE_PAT = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_REF = process.env.SUPABASE_PROJECT_REF;
const NOTION_KEY = process.env.NOTION_API_KEY;
const NOTION_DB = process.env.NOTION_BLOG_DB;
const SITE_PASSWORD = process.env.SITE_PASSWORD;
const GSC_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;

if (!SUPABASE_PAT || !SUPABASE_REF) {
  console.error("SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF manquant");
  process.exit(1);
}

// ===================================================================
// Seuils (alignes sur src/lib/seo/audit.ts)
// ===================================================================
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const ARTICLE_STALE_DAYS = 365;

const KEY_LANDINGS = [
  { path: "/", label: "Homepage", severity: "high" },
  { path: "/academy", label: "Page de vente Academy", severity: "high" },
  { path: "/family", label: "Page de vente Family", severity: "high" },
  { path: "/cahier-preview", label: "Cahier preview (lead magnet)", severity: "medium" },
  { path: "/podcast", label: "Page podcast", severity: "medium" },
  { path: "/a-propos", label: "A propos", severity: "medium" },
  { path: "/blog", label: "Listing blog", severity: "medium" },
  { path: "/glossaire", label: "Glossaire", severity: "medium" },
  { path: "/outils-gratuits", label: "Outils gratuits", severity: "medium" },
];

// ===================================================================
// Helpers
// ===================================================================
function daysBetween(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function sqlEscape(s) {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function execSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_PAT}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase SQL error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ===================================================================
// Fetch articles Notion
// ===================================================================
async function fetchArticles() {
  if (!NOTION_KEY || !NOTION_DB) {
    console.warn("Notion API key ou DB manquant : skip articles");
    return [];
  }
  const res = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DB}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 100,
        filter: {
          and: [{ property: "Published", checkbox: { equals: true } }],
        },
        sorts: [{ property: "PublishDate", direction: "descending" }],
      }),
    }
  );
  if (!res.ok) {
    console.warn(`Notion fetch failed: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const results = data.results || [];
  console.log(`  Notion : ${results.length} articles publies`);

  return results.map((p) => {
    const props = p.properties || {};
    const getText = (prop) => {
      const x = props[prop];
      if (!x) return "";
      if (x.type === "title") return x.title?.[0]?.plain_text || "";
      if (x.type === "rich_text") return x.rich_text?.[0]?.plain_text || "";
      return "";
    };
    const getDate = (prop) => props[prop]?.date?.start || "";
    const getFiles = (prop) => {
      const f = props[prop]?.files;
      if (!f || f.length === 0) return null;
      return f[0]?.file?.url || f[0]?.external?.url || null;
    };
    return {
      title: getText("Title"),
      slug: getText("Slug"),
      excerpt: getText("Excerpt"),
      seoTitle: getText("SEO_Title"),
      seoDescription: getText("SEO_Description"),
      featuredImage: getFiles("FeaturedImage"),
      publishDate: getDate("PublishDate"),
    };
  });
}

// ===================================================================
// Auditeurs
// ===================================================================
function auditGlobalSetup() {
  const drafts = [];
  if (!GSC_VERIFICATION) {
    drafts.push({
      type: "missing_gsc_verification",
      severity: "high",
      page_path: null,
      title: "Google Search Console pas verifie",
      description: "Sans verification, on n'a pas acces aux donnees de trafic Google (impressions, clics, requetes, positions).",
      fix_action: "Ajouter GOOGLE_SITE_VERIFICATION (code de Search Console > Methode meta tag) dans les variables d'environnement Netlify, puis redeployer.",
    });
  }
  if (SITE_PASSWORD) {
    drafts.push({
      type: "site_password_active",
      severity: "high",
      page_path: null,
      title: "Site bloque par mot de passe",
      description: "SITE_PASSWORD est defini : Google ne peut pas crawler le site. Aucun ranking possible tant qu'il est actif.",
      fix_action: "Retirer SITE_PASSWORD des variables d'environnement Netlify quand le site doit etre public.",
    });
  }
  return drafts;
}

function auditArticles(articles) {
  const drafts = [];
  for (const a of articles) {
    if (!a.slug) continue;
    const path = `/blog/${a.slug}`;

    const seoTitle = a.seoTitle || a.title || "";
    if (!seoTitle) {
      drafts.push({
        type: "missing_seo_title",
        severity: "high",
        page_path: path,
        title: `Article sans titre SEO : ${a.slug}`,
        description: "Cet article n'a pas de titre SEO defini, Google va utiliser le H1 par defaut.",
        fix_action: "Renseigner le champ 'SEO Title' dans Notion (entre 30 et 60 caracteres).",
      });
    } else if (seoTitle.length > TITLE_MAX) {
      drafts.push({
        type: "seo_title_too_long",
        severity: "medium",
        page_path: path,
        title: `Titre SEO trop long (${seoTitle.length} car.) : ${a.title}`,
        description: `Google tronque les titres au-dela de ${TITLE_MAX} caracteres, le tien fait ${seoTitle.length}.`,
        fix_action: "Raccourcir le SEO Title dans Notion sous 60 caracteres.",
      });
    } else if (seoTitle.length < TITLE_MIN) {
      drafts.push({
        type: "seo_title_too_short",
        severity: "low",
        page_path: path,
        title: `Titre SEO trop court (${seoTitle.length} car.) : ${a.title}`,
        description: `Un titre SEO sous ${TITLE_MIN} caracteres est sous-exploite, ajoute des mots-cles ou le nom de marque.`,
        fix_action: "Etoffer le SEO Title (ex: ajouter 'Emeline Siron' ou la requete cible).",
      });
    }

    const desc = a.seoDescription || a.excerpt || "";
    if (!desc) {
      drafts.push({
        type: "missing_meta_description",
        severity: "high",
        page_path: path,
        title: `Article sans meta description : ${a.title}`,
        description: "Sans meta description, Google va inventer un snippet rarement optimal.",
        fix_action: "Renseigner 'SEO Description' dans Notion (entre 70 et 160 caracteres, avec un appel a l'action).",
      });
    } else if (desc.length > DESC_MAX) {
      drafts.push({
        type: "meta_description_too_long",
        severity: "medium",
        page_path: path,
        title: `Meta description trop longue (${desc.length} car.) : ${a.title}`,
        description: `Google tronque au-dela de ${DESC_MAX} caracteres, le tien fait ${desc.length}.`,
        fix_action: "Raccourcir la SEO Description dans Notion.",
      });
    } else if (desc.length < DESC_MIN) {
      drafts.push({
        type: "meta_description_too_short",
        severity: "low",
        page_path: path,
        title: `Meta description trop courte (${desc.length} car.) : ${a.title}`,
        description: "Une meta description courte gaspille de la place dans la SERP.",
        fix_action: "Etoffer la SEO Description (idealement 140-160 caracteres).",
      });
    }

    if (!a.featuredImage) {
      drafts.push({
        type: "missing_featured_image",
        severity: "medium",
        page_path: path,
        title: `Pas d'image featured : ${a.title}`,
        description: "Sans image, l'article apparait sans visuel sur les reseaux sociaux et dans Discover.",
        fix_action: "Ajouter une image featured dans Notion (1200x630 minimum).",
      });
    }

    if (a.publishDate) {
      const age = daysBetween(a.publishDate);
      if (age > ARTICLE_STALE_DAYS) {
        drafts.push({
          type: "article_stale",
          severity: "low",
          page_path: path,
          title: `Article a rafraichir (${age} jours) : ${a.title}`,
          description: "Mettre a jour le contenu et la date de publication signale a Google que c'est toujours pertinent.",
          fix_action: "Relire l'article, mettre a jour les chiffres, republier la date dans Notion.",
        });
      }
    }
  }
  return drafts;
}

async function auditKeywords() {
  const drafts = [];
  const result = await execSql(
    "SELECT keyword, priority, target_page, last_checked_at FROM seo_target_keywords"
  );
  const rows = Array.isArray(result) ? result : [];
  for (const k of rows) {
    if (!k.target_page) {
      drafts.push({
        type: "keyword_no_target_page",
        severity: k.priority === 1 ? "medium" : "low",
        page_path: null,
        title: `Mot-cle sans page cible : "${k.keyword}"`,
        description: "Pour ranker sur une requete il faut une page dediee qui la cible explicitement (titre, H1, contenu).",
        fix_action: "Assigner une page cible dans le tableau Mots-cles, ou creer une nouvelle landing.",
      });
    }
    if (!k.last_checked_at && k.priority === 1) {
      drafts.push({
        type: "keyword_never_checked",
        severity: "low",
        page_path: null,
        title: `Position non renseignee : "${k.keyword}"`,
        description: "Aucune position connue pour ce mot-cle prioritaire. Verifie dans Search Console et renseigne-la.",
        fix_action: "Aller dans Search Console > Performances, filtrer par requete, noter la position moyenne.",
      });
    }
  }
  return drafts;
}

// ===================================================================
// Main
// ===================================================================
async function main() {
  const startedAt = Date.now();
  console.log("→ Audit SEO initial");

  // 1. Insert audit row "running"
  const auditInsertSql = `INSERT INTO seo_audits (status) VALUES ('running') RETURNING id;`;
  const auditRow = await execSql(auditInsertSql);
  const auditId = auditRow?.[0]?.id;
  if (!auditId) throw new Error("Impossible de creer l'audit row");
  console.log(`  audit_id : ${auditId}`);

  try {
    // 2. Fetch sources
    console.log("→ Chargement articles Notion...");
    const articles = await fetchArticles();

    // 3. Run auditeurs
    console.log("→ Execution auditeurs...");
    const drafts = [
      ...auditGlobalSetup(),
      ...auditArticles(articles),
      ...(await auditKeywords()),
    ];
    console.log(`  ${drafts.length} recommandations generees`);

    // 4. Purge anciennes recos open + INSERT batch
    await execSql("DELETE FROM seo_recommendations WHERE status = 'open';");

    if (drafts.length > 0) {
      const values = drafts
        .map(
          (d) =>
            `(${sqlEscape(auditId)}, ${sqlEscape(d.type)}, ${sqlEscape(d.severity)}, ${sqlEscape(d.page_path)}, ${sqlEscape(d.title)}, ${sqlEscape(d.description)}, ${sqlEscape(d.fix_action)})`
        )
        .join(",\n");
      const insertSql = `
        INSERT INTO seo_recommendations
          (audit_id, type, severity, page_path, title, description, fix_action)
        VALUES
          ${values};
      `;
      await execSql(insertSql);
    }

    const durationMs = Date.now() - startedAt;
    const pagesScanned = articles.length + KEY_LANDINGS.length;

    // 5. Update audit row
    await execSql(`
      UPDATE seo_audits SET
        status = 'completed',
        pages_scanned = ${pagesScanned},
        recommendations_count = ${drafts.length},
        duration_ms = ${durationMs}
      WHERE id = ${sqlEscape(auditId)};
    `);

    console.log("\n✅ Audit complete");
    console.log(`   ${pagesScanned} pages scannees`);
    console.log(`   ${drafts.length} recommandations`);
    console.log(`   ${durationMs} ms`);

    // Recap par severite
    const bySev = drafts.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {});
    console.log(`   high : ${bySev.high || 0}, medium : ${bySev.medium || 0}, low : ${bySev.low || 0}`);
  } catch (e) {
    await execSql(`
      UPDATE seo_audits SET
        status = 'failed',
        error_message = ${sqlEscape(e.message || "unknown")},
        duration_ms = ${Date.now() - startedAt}
      WHERE id = ${sqlEscape(auditId)};
    `).catch(() => {});
    throw e;
  }
}

main().catch((e) => {
  console.error("❌ Audit failed:", e.message);
  process.exit(1);
});
