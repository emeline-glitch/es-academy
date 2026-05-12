#!/usr/bin/env node
// Test des validators Zod sur les routes publiques.
// Lance le dev server au prealable : npm run dev (port 3001)
// Usage : BASE_URL=http://localhost:3001 node scripts/audits/test-validation.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

let passed = 0;
let failed = 0;

async function expect(name, actual, predicate, detail) {
  const ok = predicate(actual);
  if (ok) {
    console.log(`  ok    ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}${detail ? "  -> " + detail : ""}`);
    console.log("        actual:", JSON.stringify(actual).slice(0, 200));
    failed++;
  }
}

async function post(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

async function get(path) {
  const res = await fetch(BASE_URL + path);
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

// ====== /api/site-auth ======

console.log("\n/api/site-auth");
{
  // 1. JSON malforme
  const r = await post("/api/site-auth", "{not json}");
  await expect("rejette JSON invalide", r, x => x.status === 400 && x.json?.error === "JSON invalide");
}
{
  // 2. password manquant
  const r = await post("/api/site-auth", {});
  await expect("rejette body sans password", r, x => x.status === 400 && x.json?.error === "Donnees invalides");
}
{
  // 3. champ inconnu (strict)
  const r = await post("/api/site-auth", { password: "x", extra: "y" });
  await expect("rejette champ supplementaire (strict)", r, x => x.status === 400);
}
{
  // 4. mauvais password (validation OK, auth KO)
  const r = await post("/api/site-auth", { password: "wrong-password-test-123" });
  await expect("password incorrect = 401", r, x => x.status === 401);
}

// ====== /api/auth/send-magic-link ======

console.log("\n/api/auth/send-magic-link");
{
  const r = await post("/api/auth/send-magic-link", {});
  await expect("rejette body sans email", r, x => x.status === 400);
}
{
  const r = await post("/api/auth/send-magic-link", { email: "pas-un-email" });
  await expect("rejette email invalide", r, x => x.status === 400);
}
{
  const r = await post("/api/auth/send-magic-link", { email: "test@example.com", malicious: "x" });
  await expect("rejette champ supplementaire", r, x => x.status === 400);
}
{
  const r = await post("/api/auth/send-magic-link", { email: "valid@example.com" });
  await expect("email valide = 200", r, x => x.status === 200 && x.json?.ok === true);
}

// ====== /api/contacts/unsubscribe ======

console.log("\n/api/contacts/unsubscribe");
{
  const r = await post("/api/contacts/unsubscribe", {});
  await expect("rejette body sans email", r, x => x.status === 400);
}
{
  const r = await post("/api/contacts/unsubscribe", { email: "test@example.com" });
  await expect("rejette email sans token ni source (refine)", r, x => x.status === 400);
}
{
  const r = await post("/api/contacts/unsubscribe", { email: "test@example.com", source: "manual" });
  await expect("accepte email+source=manual", r, x => x.status === 200);
}
{
  const r = await post("/api/contacts/unsubscribe", { email: "test@example.com", source: "autre" });
  await expect("rejette source != 'manual'", r, x => x.status === 400);
}
{
  const r = await post("/api/contacts/unsubscribe", { email: "test@example.com", token: "fake-token" });
  await expect("token invalide = 400", r, x => x.status === 400);
}

// ====== /api/stripe/checkout ======

console.log("\n/api/stripe/checkout");
{
  const r = await post("/api/stripe/checkout", {});
  await expect("rejette body sans plan", r, x => x.status === 400);
}
{
  const r = await post("/api/stripe/checkout", { plan: "2x" });
  await expect("rejette plan invalide", r, x => x.status === 400);
}
{
  const r = await post("/api/stripe/checkout", { plan: "1x", malicious: "x" });
  await expect("rejette champ supplementaire", r, x => x.status === 400);
}

// ====== /api/track/page-view ======

console.log("\n/api/track/page-view");
{
  const r = await post("/api/track/page-view", {});
  await expect("rejette body sans path", r, x => x.status === 400);
}
{
  const r = await post("/api/track/page-view", { path: "/test" });
  await expect("accepte path seul", r, x => x.status === 200);
}
{
  const r = await post("/api/track/page-view", { path: "/test", utm_source: "x", malicious: "y" });
  await expect("rejette champ supplementaire", r, x => x.status === 400);
}

console.log(`\n${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
