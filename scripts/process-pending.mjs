/**
 * Pipeline complet pour toutes les vidéos en attente :
 *   ~/es-academy-videos/M*.mp4 dont la leçon dans le mapping n'a PAS de bunny_video_id.
 *
 * Pour chaque vidéo trouvée :
 *   1. upload Bunny (binaire)
 *   2. upload thumbnail Bunny
 *   3. création de la leçon Notion (+ Course parent + relation Module si pas fait)
 *
 * Usage : node --env-file=.env.local scripts/process-pending.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VIDEO_DIR = path.join(process.env.HOME, "es-academy-videos");
const MAPPING_PATH = "scripts/data/lessons-mapping.json";

if (!fs.existsSync(VIDEO_DIR)) { console.error(`Dossier ${VIDEO_DIR} introuvable.`); process.exit(1); }

function reload() {
  return JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
}
function lessonOf(code) {
  const [, modStr, letter] = code.match(/^M(\d{2})-([A-Z])$/);
  const mod = reload().modules.find((m) => m.order === parseInt(modStr, 10));
  return mod?.lessons.find((l) => l.letter === letter);
}

const files = fs
  .readdirSync(VIDEO_DIR)
  .filter((f) => /^M\d{2}-[A-Z]\.mp4$/.test(f))
  .sort();

if (files.length === 0) {
  console.log("Aucune vidéo .mp4 trouvée dans " + VIDEO_DIR);
  process.exit(0);
}

const pending = [];
for (const f of files) {
  const code = f.replace(/\.mp4$/, "");
  const lesson = lessonOf(code);
  if (!lesson) { console.log(`⚠️  ${code} : leçon introuvable dans le mapping, ignorée.`); continue; }
  if (lesson.bunny_video_id) {
    console.log(`✓ ${code} déjà traité (videoId=${lesson.bunny_video_id.slice(0,8)}…), skip.`);
    continue;
  }
  pending.push(code);
}

if (pending.length === 0) {
  console.log("\nRien à faire, toutes les vidéos posées sont déjà traitées.");
  process.exit(0);
}

console.log(`\n${pending.length} vidéo(s) à traiter : ${pending.join(", ")}`);
console.log("=".repeat(60));

const env = { ...process.env };
function runStep(label, scriptPath, code) {
  console.log(`\n▶︎ ${label} ${code}`);
  const r = spawnSync("node", ["--env-file=.env.local", scriptPath, code], { stdio: "inherit", env });
  if (r.status !== 0) throw new Error(`${label} a échoué pour ${code} (exit ${r.status})`);
}

let ok = 0, ko = 0;
for (const code of pending) {
  console.log("\n" + "─".repeat(60) + `\n📹 ${code}\n` + "─".repeat(60));
  try {
    runStep("Upload vidéo", "scripts/upload-video.mjs", code);
    runStep("Upload thumbnail", "scripts/upload-thumbnail.mjs", code);
    runStep("Création leçon Notion", "scripts/notion-create-lesson.mjs", code);
    ok++;
  } catch (e) {
    console.error(`\n❌ ${code} : ${e.message}`);
    ko++;
  }
}

console.log("\n" + "=".repeat(60));
console.log(`Bilan : ${ok} OK, ${ko} échec(s) sur ${pending.length} vidéos.`);
if (ok > 0) {
  console.log(`\nLes vidéos traitées sont visibles sur :`);
  console.log(`  http://localhost:3000/cours/methode-emeline-siron/mindset/<code>`);
  console.log(`Tu peux supprimer les .mp4 traités de ${VIDEO_DIR} pour libérer de la place.`);
}
