/**
 * Helpers partages pour les scenarios E2E parcours client.
 *
 * Chaque scenario simule un visiteur reel (POST sur l'API publique) puis
 * verifie en DB (service client, bypass RLS) que :
 *   - le contact existe
 *   - les bons tags sont appliques
 *   - le contact apparait dans les listes attendues
 *   - la sequence de bienvenue est bien enroll
 *   - les artefacts secondaires sont OK (audit, email_outbox, etc.)
 *
 * Usage : `node scripts/test-scenarios/01-cahier-vacances.mjs`
 * Pre-requis : dev server sur localhost:3005 (BASE_URL configurable).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
export const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

// ---------------------------------------------------------------------------
// Sortie console coloree
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

let _stepIndex = 0;
let _passed = 0;
let _failed = 0;
const _failures = [];

export function title(name) {
  _stepIndex = 0;
  _passed = 0;
  _failed = 0;
  _failures.length = 0;
  console.log(`\n${C.bold}${C.cyan}━━━ ${name} ━━━${C.reset}`);
}

export function step(label) {
  _stepIndex++;
  console.log(`\n${C.bold}${C.blue}[${_stepIndex}] ${label}${C.reset}`);
}

export function info(msg) {
  console.log(`    ${C.dim}${msg}${C.reset}`);
}

export function pass(msg) {
  _passed++;
  console.log(`    ${C.green}✅${C.reset} ${msg}`);
}

export function fail(msg, detail = "") {
  _failed++;
  _failures.push({ msg, detail });
  console.log(`    ${C.red}❌${C.reset} ${msg}${detail ? `\n       ${C.dim}${detail}${C.reset}` : ""}`);
}

export function warn(msg) {
  console.log(`    ${C.yellow}⚠️${C.reset}  ${msg}`);
}

export function summary() {
  const ok = _failed === 0;
  const color = ok ? C.green : C.red;
  console.log(
    `\n${color}${C.bold}${ok ? "✅ Scenario OK" : "❌ Scenario KO"}${C.reset} · ${C.green}${_passed} pass${C.reset} · ${C.red}${_failed} fail${C.reset}`
  );
  if (_failed > 0) {
    console.log(`\n${C.bold}Failures:${C.reset}`);
    for (const f of _failures) {
      console.log(`  ${C.red}-${C.reset} ${f.msg}${f.detail ? `\n    ${C.dim}${f.detail}${C.reset}` : ""}`);
    }
  }
  return { passed: _passed, failed: _failed, ok };
}

// ---------------------------------------------------------------------------
// Generateurs et helpers communs
// ---------------------------------------------------------------------------

/**
 * Genere un email unique pour un scenario. Le suffixe @es-test.local
 * permet de filtrer/nettoyer facilement et n'envoie aucun mail reel
 * (TLD reserve aux tests).
 */
export function testEmail(scenarioSlug) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `e2e-${scenarioSlug}-${ts}-${rand}@es-test.local`;
}

/**
 * Marqueur ajoute a chaque contact de test pour pouvoir le supprimer
 * facilement en fin de scenario, meme si on ne connait plus l'email.
 */
export const TEST_TAG = "__e2e_scenario";

/**
 * Submit un formulaire public via l'API. Retourne la reponse parsee + status.
 * On envoie pas le rate-limit headers : si le test echoue avec 429, c'est
 * qu'on a tape trop vite (verifier que dev server est isole, pas en prod).
 */
export async function submitForm(slug, body) {
  const res = await fetch(`${BASE_URL}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* body vide */
  }
  return { status: res.status, ok: res.ok, json };
}

/**
 * Attente cooperative : la cascade async (upsert -> autoEnroll -> ...) peut
 * prendre quelques ms apres le retour du POST. On laisse 250ms par defaut.
 */
export async function settle(ms = 250) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Charge le contact par email. Retourne null si absent (laisse au scenario
 * le soin d'echouer proprement).
 */
export async function getContact(email) {
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data;
}

/**
 * Verifie que le contact a tous les tags attendus. Manquants reportes en fail.
 */
export function expectTags(contact, expectedTags) {
  const actual = contact?.tags || [];
  for (const t of expectedTags) {
    if (actual.includes(t)) pass(`tag présent : ${t}`);
    else fail(`tag manquant : ${t}`, `tags actuels : ${JSON.stringify(actual)}`);
  }
}

/**
 * Verifie que le contact a la bonne source d'origine.
 */
export function expectSource(contact, expected) {
  if (!contact) return fail(`source : contact null`);
  if (contact.source === expected) pass(`source = "${expected}"`);
  else fail(`source attendue "${expected}", actuelle "${contact.source}"`);
}

/**
 * Verifie que le contact est dans la liste correspondant a un tag_key.
 * Les listes sont tag-based : un contact appartient a une liste si son
 * tableau tags contient le tag_key de la liste.
 */
export async function expectInList(contact, listTagKey, listLabel = null) {
  const { data: list } = await supabase
    .from("contact_lists")
    .select("name, tag_key")
    .eq("tag_key", listTagKey)
    .maybeSingle();
  if (!list) {
    return fail(`liste introuvable pour tag_key="${listTagKey}"`);
  }
  const name = listLabel || list.name;
  if ((contact?.tags || []).includes(listTagKey)) {
    pass(`appartient à la liste "${name}"`);
  } else {
    fail(`n'apparaît pas dans la liste "${name}"`, `tag_key attendu : ${listTagKey}`);
  }
}

/**
 * Verifie qu'un email_sequence_enrollments existe pour ce contact + sequence.
 * Diagnostique aussi les causes communes d'echec : seq en draft, steps vide.
 */
export async function expectSequenceEnrollment(contact, sequenceName) {
  if (!contact?.id) return fail(`enrollment seq "${sequenceName}" : contact null`);
  const { data: seq } = await supabase
    .from("email_sequences")
    .select("id, name, status, steps, trigger_type, trigger_value")
    .eq("name", sequenceName)
    .maybeSingle();
  if (!seq) return fail(`séquence introuvable : "${sequenceName}"`);

  // Diagnostic : si la seq n'est pas active, autoEnrollByTags la skip.
  if (seq.status !== "active") {
    fail(
      `séquence "${sequenceName}" en status="${seq.status}"`,
      `autoEnrollByTags ne picke que status="active". Tiffany doit écrire les mails puis activer dans /admin/sequences.`
    );
    return null;
  }
  if (!Array.isArray(seq.steps) || seq.steps.length === 0) {
    fail(
      `séquence "${sequenceName}" sans steps (vide)`,
      `Le trigger est OK mais aucun mail à envoyer. Ajoute des steps dans /admin/sequences.`
    );
  }

  const { data: enr } = await supabase
    .from("email_sequence_enrollments")
    .select("id, status, current_step, next_send_at, enrolled_at")
    .eq("sequence_id", seq.id)
    .eq("contact_id", contact.id)
    .maybeSingle();
  if (!enr) {
    return fail(
      `pas enrollé dans "${sequenceName}"`,
      `Vérifie que le tag "${seq.trigger_value}" est bien dans contact.tags ET que autoEnrollByTags est appelé après l'upsert.`
    );
  }
  pass(`enrollé dans "${sequenceName}"`);
  if (enr.status === "active") pass(`enrollment.status = active`);
  else warn(`enrollment.status = ${enr.status} (attendu "active")`);
  if (enr.next_send_at) pass(`next_send_at planifié : ${new Date(enr.next_send_at).toLocaleString("fr-FR")}`);
  else warn(`next_send_at est null (steps vide ?)`);
  return enr;
}

/**
 * Nettoyage : supprime le contact de test (et la cascade Supabase nettoie
 * email_sequence_enrollments via la FK). Utile pour pouvoir relancer le
 * scenario plusieurs fois sans accumuler des contacts de test.
 */
export async function cleanup(email) {
  if (!email) return;
  await supabase.from("contacts").delete().eq("email", email.toLowerCase());
}

/**
 * Cleanup general : supprime tous les contacts taguees TEST_TAG, plus tous
 * ceux dont l'email finit par @es-test.local. A appeler avant un run pour
 * partir propre.
 */
export async function cleanupAll() {
  await supabase.from("contacts").delete().ilike("email", "%@es-test.local");
}

/**
 * Verifie que le dev server repond. Si non, on echoue tout de suite avec
 * un message clair plutot que de faire des dizaines de fetch qui timeout.
 */
export async function requireDevServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { method: "GET" });
    if (res.ok) return true;
  } catch {
    /* fall through */
  }
  // Essai fallback sur la home
  try {
    const res = await fetch(BASE_URL, { method: "HEAD" });
    if (res.status < 500) return true;
  } catch (e) {
    console.error(
      `${C.red}${C.bold}❌ Dev server inaccessible sur ${BASE_URL}${C.reset}\n` +
        `   Lance \`npm run dev\` ou definis BASE_URL=https://emeline-siron.fr\n` +
        `   Detail : ${e.message}`
    );
    process.exit(2);
  }
  return true;
}
