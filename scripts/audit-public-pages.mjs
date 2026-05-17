#!/usr/bin/env node
/**
 * Audit pages publiques : crawler qui visite chaque page accessible aux
 * visiteurs et verifie 6 axes :
 *   1. HTTP status (404, 500, redirect chains)
 *   2. OG meta (title, description, image)
 *   3. Twitter card
 *   4. Canonical link
 *   5. Schema.org JSON-LD si present (parsing valide)
 *   6. CTAs : <a>/<button> pointant vers Stripe/Calendly/forms doivent
 *      avoir data-cta="..." pour l'attribution
 *
 * Bonus : images <img src> testees en HEAD (eviter les 404 visuels).
 *
 * Usage :
 *   node scripts/audit-public-pages.mjs                      # local
 *   BASE_URL=https://emeline-siron.fr node scripts/audit-public-pages.mjs
 *   QUICK=1 node scripts/audit-public-pages.mjs              # skip images check
 */
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";
const SKIP_IMAGES = process.env.QUICK === "1";

// ---------------------------------------------------------------------------
// Output coloré
// ---------------------------------------------------------------------------
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const issues = { error: [], warn: [], info: [] };
const stats = { pages_ok: 0, pages_error: 0, ctas_untagged: 0, images_broken: 0 };

function err(category, page, msg, detail) {
  issues.error.push({ category, page, msg, detail });
  console.log(`  ${C.red}🔴${C.reset} ${C.bold}${page}${C.reset} : ${msg}${detail ? `\n     ${C.dim}${detail}${C.reset}` : ""}`);
}
function warn(category, page, msg, detail) {
  issues.warn.push({ category, page, msg, detail });
  console.log(`  ${C.yellow}🟡${C.reset} ${page} : ${msg}${detail ? `\n     ${C.dim}${detail}${C.reset}` : ""}`);
}

// ---------------------------------------------------------------------------
// Decouvre les pages publiques a partir du filesystem
// ---------------------------------------------------------------------------
function discoverPublicRoutes(appDir = "src/app") {
  const routes = [];
  // /admin/* est protege par auth (redirect /connexion), inutile a auditer
  // comme page publique. Pareil pour /dashboard, /coaching, /profil etc.
  // qui sont des espaces eleve auth-only.
  const skipPatterns = [
    /\/admin/, /\/api\//, /\/preview\//, /\[/, /^_/,
    /^\/dashboard/, /^\/coaching/, /^\/profil/, /^\/ressources/, /^\/evaluation/,
  ];

  function walk(dir, urlPath = "") {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        // Skip dynamic segments [slug], (groups), private _xxx
        if (e.startsWith("_")) continue;
        if (e.startsWith("(") && e.endsWith(")")) {
          walk(full, urlPath); // route group, no URL impact
        } else if (e.startsWith("[") && e.endsWith("]")) {
          continue; // skip dynamic
        } else {
          walk(full, urlPath + "/" + e);
        }
      } else if (e === "page.tsx") {
        const url = urlPath || "/";
        if (!skipPatterns.some((p) => p.test(url))) {
          routes.push(url);
        }
      }
    }
  }

  walk(appDir);
  return Array.from(new Set(routes)).sort();
}

// ---------------------------------------------------------------------------
// Audit d'une page
// ---------------------------------------------------------------------------
async function auditPage(path) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, { redirect: "manual" });
  } catch (e) {
    err("http", path, `fetch failed`, e.message);
    stats.pages_error++;
    return;
  }

  // 1. HTTP status
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") || "?";
    // Redirects (e.g., site-password gate) sont OK si volontaires, sinon a investiguer
    if (path === "/" || path === "/connexion") {
      // skip : ces pages peuvent legitimement rediriger selon contexte
    } else if (location.includes("/site-password")) {
      // site password gate : skip cette page-la, c'est attendu en local
      return;
    } else {
      warn("http", path, `redirect ${res.status} → ${location}`);
    }
  } else if (res.status >= 400) {
    err("http", path, `HTTP ${res.status}`);
    stats.pages_error++;
    return;
  }

  // 2. Body parse
  let html;
  try {
    html = await res.text();
  } catch (e) {
    err("http", path, `body read failed`, e.message);
    stats.pages_error++;
    return;
  }
  if (html.length < 500) {
    warn("http", path, `body très court (${html.length} chars)`, "Probablement une 404 next.js avec fallback");
  }
  stats.pages_ok++;

  // 3. Meta tags
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch || !titleMatch[1].trim()) {
    err("meta", path, `<title> absent ou vide`);
  } else if (titleMatch[1].length < 10) {
    warn("meta", path, `<title> très court (${titleMatch[1].length} chars)`, `"${titleMatch[1]}"`);
  } else if (titleMatch[1].length > 70) {
    warn("meta", path, `<title> > 70 chars`, `Tronque dans Google : "${titleMatch[1].slice(0, 80)}…"`);
  }

  const descMatch = html.match(/<meta name="description"[^>]*content="([^"]+)"/);
  if (!descMatch || !descMatch[1].trim()) {
    warn("meta", path, `meta description absente`);
  } else if (descMatch[1].length < 50) {
    warn("meta", path, `description courte (${descMatch[1].length} chars)`);
  } else if (descMatch[1].length > 200) {
    warn("meta", path, `description > 200 chars`, `Tronque dans SERP`);
  }

  // 4. OG meta
  const ogChecks = [
    { key: "og:title", regex: /<meta property="og:title"[^>]*content="([^"]+)"/ },
    { key: "og:description", regex: /<meta property="og:description"[^>]*content="([^"]+)"/ },
    { key: "og:image", regex: /<meta property="og:image"[^>]*content="([^"]+)"/ },
  ];
  for (const c of ogChecks) {
    const m = html.match(c.regex);
    if (!m || !m[1].trim()) {
      warn("og", path, `${c.key} absent`);
    } else if (c.key === "og:image" && !m[1].match(/\.(jpe?g|png|webp)$/i)) {
      warn("og", path, `og:image suspect`, m[1]);
    }
  }

  // 5. Twitter card
  if (!/<meta name="twitter:card"/i.test(html)) {
    warn("og", path, `twitter:card absent`);
  }

  // 6. Canonical
  const canonicalMatch = html.match(/<link rel="canonical"[^>]*href="([^"]+)"/);
  if (!canonicalMatch) {
    warn("seo", path, `canonical absent`);
  }

  // 7. Schema.org JSON-LD si present : doit parser
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of jsonLdMatches) {
    try {
      JSON.parse(m[1].trim());
    } catch (e) {
      err("schema", path, `JSON-LD invalide`, e.message.slice(0, 100));
    }
  }

  // 8. CTAs : Stripe checkout / Calendly / Stripe.com sans data-cta
  // Pattern : <a href="..."> ou <button> dont le target match /api/stripe ou calendly.com
  const ctaRegex = /<(a|button)\b([^>]*)>/gi;
  let cm;
  while ((cm = ctaRegex.exec(html)) !== null) {
    const attrs = cm[2];
    const href = (attrs.match(/\bhref="([^"]+)"/) || [])[1] || "";
    const action = (attrs.match(/\bformaction="([^"]+)"/) || [])[1] || "";
    const target = href || action;
    if (!target) continue;
    const isStripe = /\/api\/stripe|stripe\.com\/checkout/.test(target);
    const isCalendly = /calendly\.com/.test(target);
    if ((isStripe || isCalendly) && !/data-cta="/.test(attrs)) {
      warn("cta", path, `CTA sans data-cta`, `href="${target.slice(0, 60)}…"`);
      stats.ctas_untagged++;
    }
  }

  // 9. Images <img src> : test rapide HEAD (skip si QUICK=1)
  if (!SKIP_IMAGES) {
    const imgMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].slice(0, 6); // max 6 par page
    for (const m of imgMatches) {
      let src = m[1];
      if (src.startsWith("/_next/image?")) {
        // Image Next.js optimisée : skip
        continue;
      }
      if (src.startsWith("data:")) continue;
      if (src.startsWith("/")) src = `${BASE_URL}${src}`;
      else if (!src.startsWith("http")) continue;
      try {
        const r = await fetch(src, { method: "HEAD" });
        if (!r.ok) {
          warn("image", path, `image ${r.status}`, src);
          stats.images_broken++;
        }
      } catch (e) {
        warn("image", path, `image fetch KO`, e.message);
        stats.images_broken++;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
console.log(`\n${C.bold}${C.cyan}═══ Audit pages publiques ═══${C.reset}`);
console.log(`${C.dim}Base : ${BASE_URL}${C.reset}\n`);

const routes = discoverPublicRoutes();
console.log(`${C.dim}${routes.length} pages publiques découvertes${C.reset}\n`);

for (const r of routes) {
  await auditPage(r);
}

// ---------------------------------------------------------------------------
// SOMMAIRE
// ---------------------------------------------------------------------------
console.log(`\n${C.bold}${C.cyan}═══ Sommaire ═══${C.reset}`);
console.log(
  `  ${C.green}✅ ${stats.pages_ok} pages OK${C.reset}  ·  ${C.red}🔴 ${issues.error.length} erreurs${C.reset}  ·  ${C.yellow}🟡 ${issues.warn.length} warnings${C.reset}`
);
console.log(
  `  ${C.dim}CTAs sans data-cta : ${stats.ctas_untagged} · Images cassees : ${stats.images_broken}${C.reset}\n`
);

if (issues.error.length > 0) {
  console.log(`${C.red}${C.bold}Erreurs (a fixer)${C.reset}`);
  const grouped = {};
  for (const i of issues.error) {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  }
  for (const [cat, items] of Object.entries(grouped)) {
    console.log(`\n  ${C.bold}[${cat}]${C.reset}`);
    for (const item of items.slice(0, 10)) {
      console.log(`    ${C.red}-${C.reset} ${item.page} : ${item.msg}`);
    }
    if (items.length > 10) console.log(`    ${C.dim}… +${items.length - 10}${C.reset}`);
  }
}

if (issues.warn.length > 0 && process.env.VERBOSE) {
  console.log(`\n${C.yellow}${C.bold}Warnings${C.reset}`);
  for (const w of issues.warn) {
    console.log(`  ${C.yellow}-${C.reset} ${w.page} : ${w.msg}`);
  }
} else if (issues.warn.length > 0) {
  // Resume par categorie
  const grouped = {};
  for (const w of issues.warn) {
    grouped[w.category] = (grouped[w.category] || 0) + 1;
  }
  console.log(`\n${C.yellow}${C.bold}Warnings par categorie${C.reset}`);
  for (const [cat, n] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${C.yellow}-${C.reset} ${cat} : ${n}`);
  }
  console.log(`  ${C.dim}VERBOSE=1 pour les voir en detail${C.reset}`);
}

process.exit(issues.error.length > 0 ? 1 : 0);
