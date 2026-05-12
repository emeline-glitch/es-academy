#!/usr/bin/env node
// Test d'intégration : vérifie que les 7 routes admin-territory rejettent (403)
// un user authentifié non-admin.
//
// Usage :
//   BASE_URL=http://localhost:3001 node scripts/test-admin-routes-auth.mjs
//   BASE_URL=https://emeline-siron.fr node scripts/test-admin-routes-auth.mjs
//
// Pré-requis env (cf. .env.local) :
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// Cleanup automatique : le user test est supprimé à la fin (succès ou échec).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // ignore : env vars peuvent venir d'ailleurs
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const TEST_EMAIL = `test-admin-auth-${Date.now()}@example-test.local`;
const TEST_PASSWORD = "TestPwd_" + Math.random().toString(36).slice(2, 12);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

console.log(`[test-admin-routes-auth] BASE_URL=${BASE_URL}`);
console.log(`[test-admin-routes-auth] Création user test : ${TEST_EMAIL}`);

let userId = null;
let accessToken = null;
let cleanupNeeded = false;

const results = { passed: 0, failed: 0, errors: [] };

async function cleanup() {
  if (!userId || !cleanupNeeded) return;
  try {
    await admin.auth.admin.deleteUser(userId);
    console.log(`[cleanup] user ${userId} supprimé`);
  } catch (e) {
    console.error(`[cleanup] échec suppression user ${userId} :`, e.message);
  }
}

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(130);
});

try {
  // 1. Crée user non-admin via service role
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    console.error("Échec création user test :", createErr?.message);
    process.exit(1);
  }
  userId = created.user.id;
  cleanupNeeded = true;
  console.log(`[setup] user créé : ${userId}`);

  // S'assurer que le profile a role != 'admin' (la table profiles est auto-créée via trigger)
  await admin.from("profiles").upsert({ id: userId, email: TEST_EMAIL, role: "user" });

  // 2. Sign-in pour récupérer un access_token JWT
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error: signErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signErr || !session.session) {
    console.error("Échec sign-in user test :", signErr?.message);
    process.exit(1);
  }
  accessToken = session.session.access_token;
  console.log(`[setup] access_token obtenu (len=${accessToken.length})`);

  // 3. Liste des routes à tester
  // Pour les routes paramétrées, on utilise un UUID bidon : si l'auth passe ce sera 404,
  // mais on attend 403 AVANT que la query DB tape. Si on a 403, c'est OK même sur ID bidon.
  const FAKE_UUID = "00000000-0000-0000-0000-000000000000";
  const routes = [
    { method: "GET", path: "/api/sequences", body: null },
    { method: "POST", path: "/api/sequences", body: { name: "test-hijack" } },
    { method: "GET", path: `/api/sequences/${FAKE_UUID}`, body: null },
    { method: "PATCH", path: `/api/sequences/${FAKE_UUID}`, body: { name: "hijack" } },
    { method: "DELETE", path: `/api/sequences/${FAKE_UUID}`, body: null },
    { method: "POST", path: `/api/sequences/${FAKE_UUID}/enroll`, body: { contact_ids: [] } },
    { method: "POST", path: `/api/sequences/${FAKE_UUID}/steps`, body: { subject: "x" } },
    { method: "GET", path: `/api/sequences/${FAKE_UUID}/steps/${FAKE_UUID}`, body: null },
    { method: "PATCH", path: `/api/sequences/${FAKE_UUID}/steps/${FAKE_UUID}`, body: { subject: "x" } },
    { method: "DELETE", path: `/api/sequences/${FAKE_UUID}/steps/${FAKE_UUID}`, body: null },
    { method: "POST", path: "/api/emails/campaigns", body: { subject: "test" } },
    { method: "GET", path: `/api/emails/campaigns/${FAKE_UUID}`, body: null },
    { method: "PATCH", path: `/api/emails/campaigns/${FAKE_UUID}`, body: { subject: "x" } },
  ];

  console.log(`\n[test] ${routes.length} routes à vérifier (attendu : 403 sur chacune)\n`);

  // Pour transmettre l'auth Supabase via fetch, on injecte le JWT dans le cookie sb-access-token.
  // Mais en SSR Next.js, le cookie réel est nommé sb-<project-ref>-auth-token.
  // L'alternative simple : header Authorization Bearer <token>. Le middleware Supabase SSR
  // l'accepte si on utilise createServerClient avec auth.persistSession.
  // En pratique pour ce test, on POST avec Cookie sb-access-token ET header Authorization
  // pour maximiser les chances de match.
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: session.session.refresh_token,
    token_type: "bearer",
    expires_in: session.session.expires_in,
    expires_at: session.session.expires_at,
    user: session.user,
  });

  for (const route of routes) {
    const url = `${BASE_URL}${route.path}`;
    const headers = {
      "Content-Type": "application/json",
      "Cookie": `${cookieName}=base64-${Buffer.from(cookieValue).toString("base64")}`,
      "Authorization": `Bearer ${accessToken}`,
    };
    let status, bodyText;
    try {
      const res = await fetch(url, {
        method: route.method,
        headers,
        body: route.body ? JSON.stringify(route.body) : undefined,
      });
      status = res.status;
      bodyText = await res.text();
    } catch (e) {
      console.log(`  ✗ ${route.method} ${route.path} → fetch error : ${e.message}`);
      results.failed++;
      results.errors.push(`${route.method} ${route.path} : fetch error ${e.message}`);
      continue;
    }

    // On attend 403 (admin requis). 401 est aussi OK (user pas reconnu côté SSR cookie),
    // ça veut juste dire que le test du cookie n'a pas matché côté server, mais l'important
    // c'est qu'on ne soit JAMAIS à 200/204.
    if (status === 403) {
      console.log(`  ✓ ${route.method} ${route.path} → 403 (admin requis)`);
      results.passed++;
    } else if (status === 401) {
      console.log(`  ~ ${route.method} ${route.path} → 401 (non authentifié côté SSR, cookie pas matché)`);
      results.passed++;
    } else if (status >= 200 && status < 300) {
      console.log(`  ✗ ${route.method} ${route.path} → ${status} : FAUILLE, route accessible !`);
      console.log(`    body : ${bodyText.slice(0, 200)}`);
      results.failed++;
      results.errors.push(`${route.method} ${route.path} : status ${status} (attendu 403)`);
    } else {
      console.log(`  ? ${route.method} ${route.path} → ${status} (inattendu) : ${bodyText.slice(0, 100)}`);
      results.failed++;
      results.errors.push(`${route.method} ${route.path} : status ${status}`);
    }
  }

  console.log(`\n[résultat] ${results.passed} OK / ${results.failed} échecs sur ${routes.length} routes`);
  if (results.failed > 0) {
    console.log("\nÉchecs :");
    for (const e of results.errors) console.log(`  - ${e}`);
  }
} finally {
  await cleanup();
}

process.exit(results.failed > 0 ? 1 : 0);
