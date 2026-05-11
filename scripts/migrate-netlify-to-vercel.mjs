#!/usr/bin/env node
/**
 * Migre les env vars Netlify vers un nouveau projet Vercel.
 * Cree le projet Vercel si pas existant.
 *
 * Usage : node scripts/migrate-netlify-to-vercel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const content = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = "9f50a0e5-db4d-4bce-8cdd-267324dab06c";
const NETLIFY_ACCOUNT_SLUG = "emeline-oz07fic";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = "team_ai6hRPkUAegzBfkTjWvRW1XS";
const VERCEL_PROJECT_NAME = "es-academy";

if (!NETLIFY_TOKEN || !VERCEL_TOKEN) {
  console.error("Tokens manquants dans .env.local");
  process.exit(1);
}

async function netlifyApi(path) {
  const res = await fetch(`https://api.netlify.com${path}`, {
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Netlify HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function vercelApi(path, opts = {}) {
  const url = `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${VERCEL_TEAM_ID}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Vercel ${path} HTTP ${res.status}: ${body}`);
  return body ? JSON.parse(body) : {};
}

// 1. Verifier si le projet Vercel existe deja
console.log("→ Recherche projet Vercel existant...");
const existingProjects = await vercelApi(`/v10/projects?limit=20`);
let project = (existingProjects.projects || []).find(p => p.name === VERCEL_PROJECT_NAME);

if (project) {
  console.log(`  Projet existant trouve : ${project.name} (${project.id})`);
} else {
  console.log("→ Creation du projet Vercel...");
  project = await vercelApi(`/v10/projects`, {
    method: "POST",
    body: JSON.stringify({
      name: VERCEL_PROJECT_NAME,
      framework: "nextjs",
      buildCommand: "npm run build",
      installCommand: "npm install",
    }),
  });
  console.log(`  Projet cree : ${project.name} (${project.id})`);
}

// 2. Recuperer toutes les env vars Netlify (avec reveal pour les secrets)
console.log("\n→ Recuperation des env vars Netlify...");
const envList = await netlifyApi(
  `/api/v1/accounts/${NETLIFY_ACCOUNT_SLUG}/env?site_id=${NETLIFY_SITE_ID}`
);
console.log(`  ${envList.length} variables trouvees`);

// 3. Recuperer la valeur de chaque var (les secrets necessitent un call separe)
const envWithValues = [];
for (const v of envList) {
  if (v.is_secret) {
    // Pour les secrets, faut hit l'endpoint detail (la list retourne ****)
    const detail = await netlifyApi(
      `/api/v1/accounts/${NETLIFY_ACCOUNT_SLUG}/env/${v.key}?site_id=${NETLIFY_SITE_ID}`
    );
    // On prend la valeur production
    const prodValue = (detail.values || []).find(x => x.context === "production");
    if (prodValue?.value) {
      envWithValues.push({ key: v.key, value: prodValue.value, is_secret: true });
    } else {
      console.log(`  ⚠ ${v.key} : valeur production non trouvee, skip`);
    }
  } else {
    const prodValue = (v.values || []).find(x => x.context === "all" || x.context === "production");
    if (prodValue?.value) {
      envWithValues.push({ key: v.key, value: prodValue.value, is_secret: false });
    } else {
      console.log(`  ⚠ ${v.key} : valeur production non trouvee, skip`);
    }
  }
}

// 4. Skip certaines vars qui ne doivent pas migrer
const SKIP = new Set([
  "SITE_PASSWORD", // on veut le site ouvert sur Vercel quand on bascule
  "NETLIFY_AUTH_TOKEN",
  "VERCEL_TOKEN",
]);

const toMigrate = envWithValues.filter(v => !SKIP.has(v.key));
console.log(`\n→ Migration de ${toMigrate.length} vars (${envWithValues.length - toMigrate.length} skip)`);

// 5. POST chaque var sur Vercel
let added = 0, skipped = 0;
for (const v of toMigrate) {
  try {
    await vercelApi(`/v10/projects/${project.id}/env`, {
      method: "POST",
      body: JSON.stringify({
        key: v.key,
        value: v.value,
        type: v.is_secret ? "encrypted" : "encrypted", // Vercel chiffre tout cote serveur
        target: ["production", "preview", "development"],
      }),
    });
    added++;
    console.log(`  ✓ ${v.key}`);
  } catch (e) {
    if (e.message.includes("already exists") || e.message.includes("ENV_ALREADY_EXISTS")) {
      skipped++;
      console.log(`  − ${v.key} (deja existe, skip)`);
    } else {
      console.log(`  ✗ ${v.key} : ${e.message.slice(0, 100)}`);
    }
  }
}

console.log(`\n→ ${added} env vars ajoutees, ${skipped} deja existantes`);
console.log(`\nProjet Vercel : https://vercel.com/${VERCEL_TEAM_ID}/${project.name}`);
console.log("\nProchaines etapes manuelles :");
console.log("  1. Vercel > projet es-academy > Settings > Git : connecter le repo emeline-glitch/es-academy");
console.log("     - Production branch : main");
console.log("  2. Premier deploy automatique au push, ou trigger manuellement");
console.log("  3. Une fois le deploy OK : repointer DNS emeline-siron.fr vers Vercel");
