#!/usr/bin/env node
/**
 * Lance tous les scenarios E2E parcours client sequentiellement.
 *
 * Sequentiel et pas en parallele pour :
 * - Eviter le rate-limit de /api/forms/[slug]/submit (3/min/IP).
 * - Avoir une sortie console lisible.
 * - Faciliter le debug : on stop des qu'un scenario crash.
 *
 * Usage : `node scripts/test-scenarios/run-all.mjs`
 *         `BASE_URL=https://emeline-siron.fr node scripts/test-scenarios/run-all.mjs`
 */
import { spawn } from "child_process";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const scenarios = readdirSync(here)
  .filter((f) => /^\d{2}-.+\.mjs$/.test(f))
  .sort();

const results = [];
let totalPass = 0;
let totalFail = 0;

console.log(`\n\x1b[1m\x1b[36m═══ ${scenarios.length} scenarios a executer ═══\x1b[0m`);

for (const file of scenarios) {
  const start = Date.now();
  const code = await new Promise((res) => {
    const p = spawn("node", [resolve(here, file)], {
      stdio: "inherit",
      env: { ...process.env },
    });
    p.on("close", res);
    p.on("error", () => res(1));
  });
  const ms = Date.now() - start;
  const ok = code === 0;
  if (ok) totalPass++;
  else totalFail++;
  results.push({ file, ok, ms });
  // Petite pause entre scenarios pour respecter le rate-limit IP.
  if (file !== scenarios[scenarios.length - 1]) {
    await new Promise((r) => setTimeout(r, 1500));
  }
}

console.log(`\n\x1b[1m\x1b[36m═══ Recapitulatif ═══\x1b[0m`);
for (const r of results) {
  const icon = r.ok ? "\x1b[32m✅\x1b[0m" : "\x1b[31m❌\x1b[0m";
  console.log(`  ${icon}  ${r.file.padEnd(36)} ${r.ms}ms`);
}
console.log(
  `\n  \x1b[32m${totalPass} ok\x1b[0m · \x1b[31m${totalFail} ko\x1b[0m / ${scenarios.length} scenarios\n`
);

process.exit(totalFail > 0 ? 1 : 0);
