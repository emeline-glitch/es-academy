#!/usr/bin/env node
// Audit RLS : interroge Supabase via Management API et dump JSON sur stdout.
// Usage : node scripts/audit-rls.mjs > /tmp/rls-audit.json

import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local introuvable. Lance depuis ~/es-academy.');
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!PAT || !REF) {
  console.error('SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF manquant.');
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        'User-Agent': 'audit-rls/1.0',
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 500)}`);
  }
  return res.json();
}

const QUERIES = {
  tables: `
    SELECT
      schemaname,
      tablename,
      rowsecurity AS rls_enabled,
      (SELECT count(*)::int FROM pg_policies p
        WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) AS policy_count
    FROM pg_tables t
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `,
  policies: `
    SELECT
      schemaname, tablename, policyname,
      permissive, roles, cmd,
      qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,
  security_definer: `
    SELECT
      n.nspname AS schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args,
      CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
      pg_get_functiondef(p.oid) AS body
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth')
      AND p.prosecdef = true
    ORDER BY n.nspname, p.proname;
  `,
  views: `
    SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;
  `,
  matviews: `
    SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'public' ORDER BY matviewname;
  `,
};

const out = {};
for (const [key, q] of Object.entries(QUERIES)) {
  process.stderr.write(`-> ${key}\n`);
  out[key] = await runSql(q);
}

console.log(JSON.stringify(out, null, 2));
