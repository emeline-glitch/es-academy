import { createServiceClient } from "@/lib/supabase/server";
import { getPublishedArticles, type Article } from "@/lib/notion/blog";
import { SITE_URL } from "@/lib/utils/constants";

// ============================================================
// Seuils d'audit (ajustables ici, pas de magic number ailleurs)
// ============================================================
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const ARTICLE_STALE_DAYS = 365;          // article non touche depuis 1 an
const KEY_LANDING_MIN_VIEWS_30D = 30;    // /academy /family devraient depasser ca
const ARTICLE_LOW_VIEWS_30D = 5;         // article publie > 30j avec < 5 vues
const PUBLISH_RECENT_DAYS = 30;

// ============================================================
// Pages cles dont on attend du trafic (audit "page importante peu visitee")
// Liste hardcodee : ce sont les pages commerciales et editoriales pivot.
// ============================================================
const KEY_LANDINGS: Array<{ path: string; label: string; severity: "high" | "medium" }> = [
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

export type RecoType =
  | "missing_meta_description"
  | "meta_description_too_long"
  | "meta_description_too_short"
  | "missing_seo_title"
  | "seo_title_too_long"
  | "seo_title_too_short"
  | "missing_featured_image"
  | "article_stale"
  | "low_traffic_landing"
  | "no_traffic_landing"
  | "article_low_traffic"
  | "keyword_no_target_page"
  | "keyword_never_checked"
  | "missing_gsc_verification"
  | "site_password_active";

export type Severity = "high" | "medium" | "low";

interface DraftReco {
  type: RecoType;
  severity: Severity;
  page_path: string | null;
  title: string;
  description: string;
  fix_action: string | null;
}

// ============================================================
// Helpers
// ============================================================
function daysBetween(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

async function getPageViewCounts(periodDays: number): Promise<Map<string, number>> {
  const supabase = await createServiceClient();
  const cutoff = new Date(Date.now() - periodDays * 24 * 3600 * 1000).toISOString();
  // Pas de RPC dedie ici : un select group by suffit (volume gere par index)
  const { data, error } = await supabase
    .from("seo_page_views")
    .select("path")
    .eq("is_bot", false)
    .gte("viewed_at", cutoff);
  if (error || !data) return new Map();
  const counts = new Map<string, number>();
  for (const row of data as Array<{ path: string }>) {
    counts.set(row.path, (counts.get(row.path) || 0) + 1);
  }
  return counts;
}

// ============================================================
// Auditeurs (un par categorie de check)
// ============================================================
function auditArticles(articles: Article[]): DraftReco[] {
  const recos: DraftReco[] = [];

  for (const a of articles) {
    const path = `/blog/${a.slug}`;

    // SEO title
    const seoTitle = a.seoTitle || a.title || "";
    if (!seoTitle) {
      recos.push({
        type: "missing_seo_title",
        severity: "high",
        page_path: path,
        title: `Article sans titre SEO : ${a.slug}`,
        description: "Cet article n'a pas de titre SEO defini, Google va utiliser le H1 par defaut.",
        fix_action: "Renseigner le champ 'SEO Title' dans Notion (entre 30 et 60 caracteres).",
      });
    } else if (seoTitle.length > TITLE_MAX) {
      recos.push({
        type: "seo_title_too_long",
        severity: "medium",
        page_path: path,
        title: `Titre SEO trop long (${seoTitle.length} car.) : ${a.title}`,
        description: `Google tronque les titres au-dela de ${TITLE_MAX} caracteres, le tien fait ${seoTitle.length}.`,
        fix_action: "Raccourcir le SEO Title dans Notion sous 60 caracteres.",
      });
    } else if (seoTitle.length < TITLE_MIN) {
      recos.push({
        type: "seo_title_too_short",
        severity: "low",
        page_path: path,
        title: `Titre SEO trop court (${seoTitle.length} car.) : ${a.title}`,
        description: `Un titre SEO sous ${TITLE_MIN} caracteres est sous-exploite, ajoute des mots-cles ou le nom de marque.`,
        fix_action: "Etoffer le SEO Title (ex: ajouter 'Emeline Siron' ou la requete cible).",
      });
    }

    // Meta description
    const desc = a.seoDescription || a.excerpt || "";
    if (!desc) {
      recos.push({
        type: "missing_meta_description",
        severity: "high",
        page_path: path,
        title: `Article sans meta description : ${a.title}`,
        description: "Sans meta description, Google va inventer un snippet rarement optimal.",
        fix_action: "Renseigner 'SEO Description' dans Notion (entre 70 et 160 caracteres, avec un appel a l'action).",
      });
    } else if (desc.length > DESC_MAX) {
      recos.push({
        type: "meta_description_too_long",
        severity: "medium",
        page_path: path,
        title: `Meta description trop longue (${desc.length} car.) : ${a.title}`,
        description: `Google tronque au-dela de ${DESC_MAX} caracteres, le tien fait ${desc.length}.`,
        fix_action: "Raccourcir la SEO Description dans Notion.",
      });
    } else if (desc.length < DESC_MIN) {
      recos.push({
        type: "meta_description_too_short",
        severity: "low",
        page_path: path,
        title: `Meta description trop courte (${desc.length} car.) : ${a.title}`,
        description: "Une meta description courte gaspille de la place dans la SERP.",
        fix_action: "Etoffer la SEO Description (idealement 140-160 caracteres).",
      });
    }

    // Featured image (sert pour OG + carte twitter)
    if (!a.featuredImage) {
      recos.push({
        type: "missing_featured_image",
        severity: "medium",
        page_path: path,
        title: `Pas d'image featured : ${a.title}`,
        description: "Sans image, l'article apparait sans visuel sur les reseaux sociaux et dans Discover.",
        fix_action: "Ajouter une image featured dans Notion (1200x630 minimum).",
      });
    }

    // Article stale (publie il y a longtemps, signal Google de le rafraichir)
    if (a.publishDate) {
      const age = daysBetween(a.publishDate);
      if (age > ARTICLE_STALE_DAYS) {
        recos.push({
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

  return recos;
}

function auditTraffic(
  views: Map<string, number>,
  articles: Article[]
): DraftReco[] {
  const recos: DraftReco[] = [];

  // Pages cles : peu ou pas de trafic
  for (const lp of KEY_LANDINGS) {
    const v = views.get(lp.path) || 0;
    if (v === 0) {
      recos.push({
        type: "no_traffic_landing",
        severity: lp.severity,
        page_path: lp.path,
        title: `${lp.label} : 0 vue sur 30 jours`,
        description: "Cette page strategique n'a recu aucun trafic ce mois-ci. Verifie qu'elle est bien indexee, liee depuis le menu et partagee.",
        fix_action: "Verifier dans Search Console qu'elle est indexee, ajouter des liens internes depuis articles populaires.",
      });
    } else if (v < KEY_LANDING_MIN_VIEWS_30D) {
      recos.push({
        type: "low_traffic_landing",
        severity: lp.severity === "high" ? "medium" : "low",
        page_path: lp.path,
        title: `${lp.label} : seulement ${v} vues sur 30 jours`,
        description: `Trafic faible pour une page strategique (seuil bas : ${KEY_LANDING_MIN_VIEWS_30D}). Pousse-la depuis les articles, le podcast et l'email.`,
        fix_action: "Ajouter des CTA depuis les articles les plus vus + relancer la sequence email.",
      });
    }
  }

  // Articles publies depuis > 30j avec < 5 vues
  for (const a of articles) {
    if (!a.publishDate) continue;
    const age = daysBetween(a.publishDate);
    if (age <= PUBLISH_RECENT_DAYS) continue; // trop recent pour juger
    const path = `/blog/${a.slug}`;
    const v = views.get(path) || 0;
    if (v < ARTICLE_LOW_VIEWS_30D) {
      recos.push({
        type: "article_low_traffic",
        severity: "low",
        page_path: path,
        title: `Article peu vu : ${a.title} (${v} vue${v > 1 ? "s" : ""} en 30j)`,
        description: "Cet article ne ramene pas de trafic. A retravailler ou retirer du sitemap si non strategique.",
        fix_action: "Retravailler le titre/intro, ajouter des liens internes depuis articles plus visites, ou rediriger en 301 vers un article pivot.",
      });
    }
  }

  return recos;
}

async function auditKeywords(): Promise<DraftReco[]> {
  const supabase = await createServiceClient();
  const recos: DraftReco[] = [];

  const { data: keywords } = await supabase
    .from("seo_target_keywords")
    .select("keyword, priority, target_page, last_checked_at, current_position");

  for (const k of (keywords || []) as Array<{
    keyword: string;
    priority: number;
    target_page: string | null;
    last_checked_at: string | null;
    current_position: number | null;
  }>) {
    if (!k.target_page) {
      recos.push({
        type: "keyword_no_target_page",
        severity: k.priority === 1 ? "medium" : "low",
        page_path: null,
        title: `Mot-cle sans page cible : "${k.keyword}"`,
        description: "Pour ranker sur une requete il faut une page dediee qui la cible explicitement (titre, H1, contenu).",
        fix_action: "Assigner une page cible dans le tableau Mots-cles, ou creer une nouvelle landing.",
      });
    }
    if (!k.last_checked_at && k.priority === 1) {
      recos.push({
        type: "keyword_never_checked",
        severity: "low",
        page_path: null,
        title: `Position non renseignee : "${k.keyword}"`,
        description: "Aucune position connue pour ce mot-cle prioritaire. Verifie dans Search Console et renseigne-la.",
        fix_action: "Aller dans Search Console > Performances, filtrer par requete, noter la position moyenne.",
      });
    }
  }

  return recos;
}

function auditGlobalSetup(): DraftReco[] {
  const recos: DraftReco[] = [];

  if (!process.env.GOOGLE_SITE_VERIFICATION) {
    recos.push({
      type: "missing_gsc_verification",
      severity: "high",
      page_path: null,
      title: "Google Search Console pas verifie",
      description: "Sans verification, on n'a pas acces aux donnees de trafic Google (impressions, clics, requetes, positions).",
      fix_action: "Ajouter GOOGLE_SITE_VERIFICATION (code de Search Console > Methode meta tag) dans les variables d'environnement Netlify, puis redeployer.",
    });
  }

  if (process.env.SITE_PASSWORD) {
    recos.push({
      type: "site_password_active",
      severity: "high",
      page_path: null,
      title: "Site bloque par mot de passe",
      description: "SITE_PASSWORD est defini : Google ne peut pas crawler le site. Aucun ranking possible tant qu'il est actif.",
      fix_action: "Retirer SITE_PASSWORD des variables d'environnement Netlify quand le site doit etre public.",
    });
  }

  return recos;
}

// ============================================================
// Entree principale : lance un audit complet, persiste tout
// ============================================================
export interface AuditResult {
  audit_id: string;
  pages_scanned: number;
  recommendations_count: number;
  duration_ms: number;
}

export async function runSeoAudit(): Promise<AuditResult> {
  const supabase = await createServiceClient();
  const startedAt = Date.now();

  // 1. Cree l'audit (status running)
  const { data: auditRow, error: auditErr } = await supabase
    .from("seo_audits")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (auditErr || !auditRow) {
    throw new Error(`Failed to create audit row: ${auditErr?.message || "unknown"}`);
  }
  const auditId = auditRow.id as string;

  try {
    // 2. Charge les sources
    const [articles, viewCounts] = await Promise.all([
      getPublishedArticles(200),
      getPageViewCounts(30),
    ]);

    // 3. Lance les auditeurs
    const drafts: DraftReco[] = [
      ...auditGlobalSetup(),
      ...auditArticles(articles),
      ...auditTraffic(viewCounts, articles),
      ...(await auditKeywords()),
    ];

    // 4. Purge les anciennes recos OPEN (on regenere a chaque audit, les "done"
    //    et "dismissed" restent pour historique).
    await supabase.from("seo_recommendations").delete().eq("status", "open");

    // 5. Persiste les nouvelles recos
    if (drafts.length > 0) {
      const rows = drafts.map((d) => ({ ...d, audit_id: auditId }));
      const { error: insErr } = await supabase.from("seo_recommendations").insert(rows);
      if (insErr) throw new Error(`Insert recos failed: ${insErr.message}`);
    }

    const durationMs = Date.now() - startedAt;
    const pagesScanned = articles.length + KEY_LANDINGS.length;

    // 6. Update audit row
    await supabase
      .from("seo_audits")
      .update({
        status: "completed",
        pages_scanned: pagesScanned,
        recommendations_count: drafts.length,
        duration_ms: durationMs,
      })
      .eq("id", auditId);

    return {
      audit_id: auditId,
      pages_scanned: pagesScanned,
      recommendations_count: drafts.length,
      duration_ms: durationMs,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    await supabase
      .from("seo_audits")
      .update({ status: "failed", error_message: message, duration_ms: Date.now() - startedAt })
      .eq("id", auditId);
    throw e;
  }
}

// Export utilitaire utilise dans le dashboard
export { KEY_LANDINGS, SITE_URL };
