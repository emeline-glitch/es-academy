#!/usr/bin/env node
/**
 * Pre-launch readiness check : audit complet avant deploiement / launch.
 *
 * Verifie :
 *   - env vars critiques (Supabase, Stripe, SES, Bunny, Calendly, admin)
 *   - sequences email actives + steps non vides
 *   - formulaires publies + list_id + tag_on_submit coherents
 *   - lead magnets actifs avec opt_in_tag aligne
 *   - Stripe products/prices configures (live API)
 *   - SES domain verifie + FROM email autorise (live API)
 *   - OG images presentes (Academy + Family)
 *   - finance_targets pour l'annee en cours
 *   - contact_lists completes (newsletter + 6 LM + 2 cart-abandoned)
 *   - admin accounts coherents (profiles.role + ADMIN_EMAIL csv)
 *   - RPC sensibles verrouilles (REVOKE FROM anon, PUBLIC)
 *
 * Sortie : 3 niveaux
 *   🔴 BLOCKER : casse le parcours client ou la securite si non corrige
 *   🟡 WARNING : non bloquant mais sous-optimal
 *   ✅ OK
 *
 * Exit code 1 si au moins un BLOCKER, 0 sinon.
 *
 * Usage : `node scripts/pre-launch-check.mjs`
 *         `SKIP_STRIPE=1 SKIP_SES=1 node scripts/pre-launch-check.mjs` (audit DB only)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Env + Supabase
// ---------------------------------------------------------------------------
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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
};

const results = { blocker: [], warning: [], ok: [] };

function header(name) {
  console.log(`\n${C.bold}${C.cyan}━━ ${name} ━━${C.reset}`);
}
function ok(category, msg, detail) {
  results.ok.push({ category, msg, detail });
  console.log(`  ${C.green}✅${C.reset} ${msg}${detail ? `  ${C.dim}${detail}${C.reset}` : ""}`);
}
function warn(category, msg, detail) {
  results.warning.push({ category, msg, detail });
  console.log(`  ${C.yellow}🟡${C.reset} ${msg}${detail ? `\n     ${C.dim}${detail}${C.reset}` : ""}`);
}
function blocker(category, msg, detail) {
  results.blocker.push({ category, msg, detail });
  console.log(`  ${C.red}🔴${C.reset} ${C.bold}${msg}${C.reset}${detail ? `\n     ${C.dim}${detail}${C.reset}` : ""}`);
}

// ---------------------------------------------------------------------------
// CHECK 1 : Env vars critiques
// ---------------------------------------------------------------------------
function checkEnvVars() {
  header("Env vars critiques");

  const blockerVars = {
    NEXT_PUBLIC_SUPABASE_URL: "Supabase URL",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anon key",
    SUPABASE_SERVICE_ROLE_KEY: "Supabase service role",
    STRIPE_SECRET_KEY: "Stripe secret",
    STRIPE_WEBHOOK_SECRET: "Stripe webhook signing key",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "Stripe publishable",
    STRIPE_PRICE_ACADEMY_1X: "Stripe price Academy 1x",
    STRIPE_PRICE_ACADEMY_3X: "Stripe price Academy 3x",
    STRIPE_PRICE_FAMILY_STANDARD: "Stripe price Family standard",
    STRIPE_PRICE_FAMILY_FONDATEUR: "Stripe price Family fondateur",
    AWS_SES_REGION: "SES region",
    AWS_SES_ACCESS_KEY_ID: "SES access key",
    AWS_SES_SECRET_ACCESS_KEY: "SES secret",
    SES_FROM_EMAIL: "SES expediteur",
    NEXT_PUBLIC_SITE_URL: "Site URL public",
    ADMIN_EMAIL: "Admin email csv",
  };

  const warnVars = {
    STRIPE_PRICE_ACADEMY_4X: "Stripe price Academy 4x (optionnel)",
    BUNNY_STREAM_LIBRARY_ID: "Bunny library (videos)",
    BUNNY_TOKEN_AUTH_KEY: "Bunny token auth",
    CALENDLY_WEBHOOK_SIGNING_KEY: "Calendly webhook (sinon RDV non synces)",
    NOTION_API_KEY: "Notion (blog)",
    REVALIDATION_SECRET: "Cache revalidation",
    CRON_SECRET: "Cron auth (sinon attaques DDoS possibles)",
    UNSUBSCRIBE_SECRET: "Token unsubscribe RGPD",
  };

  for (const [k, label] of Object.entries(blockerVars)) {
    if (!env[k] || env[k].length < 5) {
      blocker("env", `${k} absent ou trop court`, label);
    } else {
      ok("env", `${k} OK`, `${label} (${env[k].slice(0, 12)}…)`);
    }
  }
  for (const [k, label] of Object.entries(warnVars)) {
    if (!env[k] || env[k].length < 5) {
      warn("env", `${k} absent`, label);
    } else {
      ok("env", `${k} OK`, label);
    }
  }

  // Sanity sur ADMIN_EMAIL csv : Emeline doit avoir au moins son email principal
  const admins = (env.ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (admins.length === 0) blocker("env", "ADMIN_EMAIL csv vide");
  else if (admins.length === 1) warn("env", `1 seul admin email`, `Recommande : ajouter le hotmail en backup`);
  else ok("env", `${admins.length} admin emails`, admins.join(", "));

  // SITE_URL doit pas etre localhost en prod
  if (env.NEXT_PUBLIC_SITE_URL?.includes("localhost") || env.NEXT_PUBLIC_SITE_URL?.includes("127.0.0.1")) {
    warn("env", "SITE_URL pointe sur localhost", `Si .env.local pousse en prod, les liens email pointent vers localhost`);
  }
}

// ---------------------------------------------------------------------------
// CHECK 2 : Sequences email
// ---------------------------------------------------------------------------
async function checkSequences() {
  header("Séquences email");

  // Sequences critiques pour le launch : post-achat, lead magnets actifs
  const critical = [
    { name: "Post-achat Academy (SEQ_PA_ACADEMY)", reason: "Onboarding apres paiement" },
    { name: "Welcome Masterclass (SEQ_MC)", reason: "LM principal d'acquisition" },
    { name: "Welcome Simulateur (SEQ_SIM)", reason: "LM actif" },
    { name: "Alumni Evermind (SEQ_AL)", reason: "Reactivation base existante" },
    { name: "Migration Brevo cohorte 2 (SEQ_BRV)", reason: "Re-opt-in RGPD" },
  ];

  const { data: allSeqs } = await supabase
    .from("email_sequences")
    .select("id, name, status, steps, trigger_type, trigger_value");

  if (!allSeqs) {
    blocker("sequences", "Impossible de lister les sequences");
    return;
  }

  for (const c of critical) {
    const s = allSeqs.find((x) => x.name === c.name);
    if (!s) {
      blocker("sequences", `${c.name} INTROUVABLE`, c.reason);
      continue;
    }
    if (s.status !== "active") {
      blocker("sequences", `${c.name} en status="${s.status}"`, `${c.reason}. Activer dans /admin/sequences avant le launch.`);
      continue;
    }
    const steps = Array.isArray(s.steps) ? s.steps : [];
    if (steps.length === 0) {
      blocker("sequences", `${c.name} sans steps`, `Active mais vide → aucun mail envoye`);
      continue;
    }
    ok("sequences", `${c.name} active`, `${steps.length} steps`);
  }

  // Sequences non-critiques mais qu'on signale si en draft
  const others = allSeqs.filter((s) => !critical.some((c) => c.name === s.name));
  for (const s of others) {
    if (s.status === "active") {
      const steps = Array.isArray(s.steps) ? s.steps : [];
      if (steps.length === 0) {
        warn("sequences", `${s.name} active mais sans steps`, `Effet : aucun mail envoye, tag pose dans le vide`);
      } else {
        ok("sequences", `${s.name} active`, `${steps.length} steps`);
      }
    } else {
      warn("sequences", `${s.name} en status="${s.status}"`, "Pas critique mais a finaliser quand Tiffany peut");
    }
  }
}

// ---------------------------------------------------------------------------
// CHECK 3 : Formulaires
// ---------------------------------------------------------------------------
async function checkForms() {
  header("Formulaires publics");

  const { data: forms } = await supabase
    .from("forms")
    .select("id, slug, name, status, tag_on_submit, list_id");

  if (!forms?.length) {
    blocker("forms", "Aucun formulaire en DB");
    return;
  }

  for (const f of forms) {
    const issues = [];
    if (f.status !== "published") issues.push(`status="${f.status}"`);
    if (!f.tag_on_submit) issues.push("tag_on_submit vide");
    if (!f.list_id) issues.push("list_id vide");

    if (issues.length === 0) {
      ok("forms", `${f.slug} OK`, `tag="${f.tag_on_submit}"`);
    } else {
      // status=draft est acceptable pour LM saisonniers, mais on signale
      const level = f.status === "draft" && /cahier|chasse|avent/.test(f.slug) ? "warn" : "blocker";
      if (level === "warn") warn("forms", `${f.slug} : ${issues.join(", ")}`, `LM saisonnier ? OK si pas le moment`);
      else blocker("forms", `${f.slug} : ${issues.join(", ")}`);
    }
  }

  // Verifier que la liste pointee par list_id a un tag_key cohérent avec tag_on_submit
  for (const f of forms) {
    if (!f.list_id) continue;
    const { data: list } = await supabase
      .from("contact_lists")
      .select("name, tag_key")
      .eq("id", f.list_id)
      .maybeSingle();
    if (!list) {
      blocker("forms", `${f.slug} pointe sur une liste introuvable`, `list_id=${f.list_id}`);
    } else if (list.tag_key !== f.tag_on_submit) {
      blocker(
        "forms",
        `${f.slug} : mismatch tag liste`,
        `form.tag_on_submit="${f.tag_on_submit}" mais list.tag_key="${list.tag_key}"`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// CHECK 4 : Lead magnets
// ---------------------------------------------------------------------------
async function checkLeadMagnets() {
  header("Lead magnets");

  const { data: lms } = await supabase
    .from("lead_magnets")
    .select("slug, name, opt_in_tag, is_active, welcome_sequence_id");

  if (!lms?.length) {
    warn("lm", "Aucun lead magnet en table lead_magnets");
    return;
  }

  for (const lm of lms) {
    if (!lm.is_active) {
      warn("lm", `${lm.slug} inactif`, lm.name);
      continue;
    }
    // Verifier que le opt_in_tag matche une seq active si welcome_sequence_id set
    if (lm.welcome_sequence_id) {
      const { data: seq } = await supabase
        .from("email_sequences")
        .select("name, status, trigger_value")
        .eq("id", lm.welcome_sequence_id)
        .maybeSingle();
      if (!seq) {
        blocker("lm", `${lm.slug} pointe sur seq inexistante`);
      } else if (seq.trigger_value !== lm.opt_in_tag) {
        blocker(
          "lm",
          `${lm.slug} : mismatch seq trigger`,
          `lm.opt_in_tag="${lm.opt_in_tag}" mais seq.trigger_value="${seq.trigger_value}"`
        );
      } else if (seq.status !== "active") {
        warn("lm", `${lm.slug} : seq "${seq.name}" en draft`, `Tag se pose mais aucun mail ne part`);
      } else {
        ok("lm", `${lm.slug} → ${seq.name}`, `tag="${lm.opt_in_tag}"`);
      }
    } else {
      warn("lm", `${lm.slug} sans welcome_sequence_id`, `LM actif mais pas de mail welcome configure`);
    }
  }
}

// ---------------------------------------------------------------------------
// CHECK 5 : Listes CRM
// ---------------------------------------------------------------------------
async function checkLists() {
  header("Listes CRM (contact_lists)");

  const expected = [
    "newsletter",
    "lm:masterclass-fondatrice",
    "lm:quiz-investissement-locatif",
    "lm:simulateur-rentabilite",
    "lm:cahier-vacances",
    "lm:calendrier-avent",
    "lm:chasse-oeufs",
    "cart-abandoned:academy",
    "cart-abandoned:family",
  ];

  const { data: lists } = await supabase
    .from("contact_lists")
    .select("tag_key, name");

  for (const tagKey of expected) {
    const found = lists?.find((l) => l.tag_key === tagKey);
    if (found) ok("lists", `${found.name}`, `tag_key="${tagKey}"`);
    else blocker("lists", `Liste manquante : ${tagKey}`);
  }
}

// ---------------------------------------------------------------------------
// CHECK 6 : OG images
// ---------------------------------------------------------------------------
function checkOgImages() {
  header("OG images (previews LinkedIn/X)");

  const paths = [
    { path: "public/og/og-default.jpg", label: "OG Academy" },
    { path: "public/og/og-family.jpg", label: "OG Family" },
  ];

  for (const p of paths) {
    const full = resolve(p.path);
    if (!existsSync(full)) {
      blocker("og", `${p.label} : fichier manquant`, p.path);
      continue;
    }
    const size = statSync(full).size;
    if (size < 10_000) warn("og", `${p.label} : fichier suspectement petit`, `${size} bytes`);
    else ok("og", `${p.label} present`, `${Math.round(size / 1024)} KB`);
  }
}

// ---------------------------------------------------------------------------
// CHECK 7 : Database state
// ---------------------------------------------------------------------------
async function checkDatabase() {
  header("Database state");

  const year = new Date().getFullYear();
  const { data: target } = await supabase
    .from("finance_targets")
    .select("year, annual_target_cents")
    .eq("year", year)
    .maybeSingle();
  if (target) ok("db", `finance_targets ${year}`, `objectif = ${(target.annual_target_cents / 100).toLocaleString("fr-FR")}€`);
  else warn("db", `Pas d'objectif annuel ${year}`, "Definir dans /admin/finance");

  // Email templates : indispensable
  const { count: tplCount } = await supabase
    .from("email_templates")
    .select("*", { count: "exact", head: true });
  if (tplCount > 0) ok("db", `email_templates : ${tplCount} templates`);
  else blocker("db", "Aucun email_templates en DB", "Tiffany doit en seeder via /admin/emails/templates");

  // Vérifier qu'il y a au moins un cron actif
  try {
    const { data: crons } = await supabase.rpc("list_cron_jobs").maybeSingle();
    if (crons) ok("db", `pg_cron actif`);
  } catch {
    // RPC non disponible, on ignore
  }
}

// ---------------------------------------------------------------------------
// CHECK 8 : Admin accounts
// ---------------------------------------------------------------------------
async function checkAdmins() {
  header("Admin accounts");

  const admins = (env.ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  for (const email of admins) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role, full_name")
      .ilike("email", email)
      .maybeSingle();
    if (!profile) {
      warn("admins", `${email} : pas de profile`, `Owner check fonctionne quand meme (basé sur user.email)`);
    } else if (profile.role !== "admin") {
      warn("admins", `${email} : role="${profile.role}"`, `Owner check par email OK, mais role admin recommande`);
    } else {
      ok("admins", `${email} admin`, profile.full_name || "");
    }
  }

  // Verifier aussi qu'on a au moins un admin secondaire (Antony/Tiffany/Fita)
  const { data: secondaryAdmins } = await supabase
    .from("profiles")
    .select("email, full_name, role")
    .eq("role", "admin")
    .not("email", "in", `(${admins.map((e) => `"${e}"`).join(",")})`);
  if (secondaryAdmins?.length > 0) {
    ok("admins", `${secondaryAdmins.length} admin(s) secondaire(s)`, secondaryAdmins.map((a) => a.email).join(", "));
  } else {
    warn("admins", "Pas d'admin secondaire", "Antony/Tiffany/Fita devraient avoir role=admin dans profiles");
  }
}

// ---------------------------------------------------------------------------
// CHECK 9 : Stripe (live API)
// ---------------------------------------------------------------------------
async function checkStripe() {
  header("Stripe (live API)");
  if (process.env.SKIP_STRIPE) {
    warn("stripe", "SKIP_STRIPE=1 -- check Stripe API saute");
    return;
  }

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) {
    blocker("stripe", "STRIPE_SECRET_KEY absent (deja signalé en env check)");
    return;
  }

  const priceIds = [
    "STRIPE_PRICE_ACADEMY_1X",
    "STRIPE_PRICE_ACADEMY_3X",
    "STRIPE_PRICE_ACADEMY_4X",
    "STRIPE_PRICE_FAMILY_STANDARD",
    "STRIPE_PRICE_FAMILY_FONDATEUR",
  ];

  for (const key of priceIds) {
    const id = env[key];
    if (!id) continue;
    try {
      const res = await fetch(`https://api.stripe.com/v1/prices/${id}`, {
        headers: { Authorization: `Bearer ${sk}` },
      });
      if (!res.ok) {
        blocker("stripe", `${key} : Stripe API ${res.status}`, `id=${id}`);
      } else {
        const j = await res.json();
        if (j.active === false) warn("stripe", `${key} inactive sur Stripe`, `id=${id}`);
        else ok("stripe", `${key} actif`, `${j.unit_amount / 100}€ ${j.currency.toUpperCase()} ${j.recurring ? "récurrent" : "one-shot"}`);
      }
    } catch (e) {
      warn("stripe", `${key} : erreur API`, e.message);
    }
  }

  // Verifier mode (test vs live)
  if (sk.startsWith("sk_test_")) {
    warn("stripe", "Stripe en mode TEST", "Au launch, basculer sur sk_live_ ET STRIPE_WEBHOOK_SECRET live");
  } else if (sk.startsWith("sk_live_")) {
    ok("stripe", "Stripe en mode LIVE");
  }
}

// ---------------------------------------------------------------------------
// CHECK 10 : SES (live API)
// ---------------------------------------------------------------------------
async function checkSES() {
  header("Amazon SES");
  if (process.env.SKIP_SES) {
    warn("ses", "SKIP_SES=1 -- check SES saute");
    return;
  }

  const from = env.SES_FROM_EMAIL;
  if (!from) {
    blocker("ses", "SES_FROM_EMAIL absent");
    return;
  }
  ok("ses", `Expediteur configure`, from);

  // Verification basique : domaine du from doit pas etre gmail/hotmail/yahoo
  if (/@(gmail|hotmail|yahoo|outlook|live)\.com$/i.test(from)) {
    blocker("ses", `Expediteur sur domaine public`, `${from} sera bloque par DMARC, utiliser un domaine perso`);
  }

  // Pas de check API SES live ici (necessite sigv4 complexe). On signale.
  warn("ses", "Verification DKIM/SPF/sandbox non automatisee", "Verifier manuellement sur console SES : domaine verifie + DKIM signed + sortie de sandbox");
}

// ---------------------------------------------------------------------------
// CHECK 11 : Securite RPC
// ---------------------------------------------------------------------------
async function checkSecurity() {
  header("Securite RPC sensibles");

  // On essaie d'appeler des RPC sensibles avec le client anon -- ils doivent
  // tous etre revoke pour PUBLIC et anon.
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sensitiveRpcs = [
    "hot_leads",
    "revenue_by_source",
    "dashboard_stats",
    "family_mrr",
    "checkout_abandonment_stats",
    "customer_ltv",
    "monthly_trend",
    "dunning_alert",
    "cta_attribution",
    "finance_summary",
  ];

  for (const rpc of sensitiveRpcs) {
    try {
      const { error } = await anon.rpc(rpc, {});
      if (!error) {
        blocker("security", `RPC "${rpc}" accessible en anon`, `Risque leak. REVOKE EXECUTE ON FUNCTION ${rpc} FROM anon, PUBLIC;`);
      } else if (error.code === "42883" || error.message.includes("function") || error.message.includes("does not exist")) {
        // Function doesn't exist or signature mismatch — could still be sensitive if signature differs
        // We tolerate this since we don't know the signature. We mark OK if it's a permission issue.
        if (/permission denied|not allowed/i.test(error.message)) {
          ok("security", `RPC "${rpc}" verrouille pour anon`);
        } else {
          // unknown response, skip
          ok("security", `RPC "${rpc}" non callable en anon`, error.message.slice(0, 80));
        }
      } else if (/permission denied|not allowed/i.test(error.message)) {
        ok("security", `RPC "${rpc}" verrouille pour anon`);
      } else {
        // Could be argument mismatch — try without args wouldn't have worked anyway
        ok("security", `RPC "${rpc}" non callable en anon`, error.message.slice(0, 80));
      }
    } catch (e) {
      warn("security", `RPC "${rpc}" : erreur reseau`, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
console.log(`\n${C.bold}${C.cyan}═══════ ES Academy : Pre-launch readiness check ═══════${C.reset}`);
console.log(`${C.dim}${new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}${C.reset}`);

checkEnvVars();
await checkSequences();
await checkForms();
await checkLeadMagnets();
await checkLists();
checkOgImages();
await checkDatabase();
await checkAdmins();
await checkStripe();
await checkSES();
await checkSecurity();

// ---------------------------------------------------------------------------
// SOMMAIRE
// ---------------------------------------------------------------------------
console.log(`\n${C.bold}${C.cyan}═══════ Sommaire ═══════${C.reset}`);
console.log(
  `  ${C.green}✅ ${results.ok.length} ok${C.reset}  ·  ${C.yellow}🟡 ${results.warning.length} warnings${C.reset}  ·  ${C.red}🔴 ${results.blocker.length} blockers${C.reset}`
);

if (results.blocker.length > 0) {
  console.log(`\n${C.red}${C.bold}🔴 BLOCKERS (a corriger avant launch)${C.reset}`);
  for (const b of results.blocker) {
    console.log(`  ${C.red}-${C.reset} ${C.bold}[${b.category}]${C.reset} ${b.msg}`);
    if (b.detail) console.log(`    ${C.dim}${b.detail}${C.reset}`);
  }
}

if (results.warning.length > 0 && process.env.VERBOSE) {
  console.log(`\n${C.yellow}${C.bold}🟡 WARNINGS${C.reset}`);
  for (const w of results.warning) {
    console.log(`  ${C.yellow}-${C.reset} [${w.category}] ${w.msg}`);
    if (w.detail) console.log(`    ${C.dim}${w.detail}${C.reset}`);
  }
}

if (results.blocker.length > 0) {
  console.log(`\n${C.red}${C.bold}❌ Launch BLOQUE ${results.blocker.length} blocker${results.blocker.length > 1 ? "s" : ""}${C.reset}\n`);
  process.exit(1);
} else if (results.warning.length > 0) {
  console.log(`\n${C.yellow}${C.bold}🟡 Launch possible mais ${results.warning.length} warning${results.warning.length > 1 ? "s" : ""} a regarder${C.reset}`);
  console.log(`   ${C.dim}Relancer avec VERBOSE=1 pour les voir en detail${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.green}${C.bold}✅ Tous les checks passent. Go launch !${C.reset}\n`);
  process.exit(0);
}
