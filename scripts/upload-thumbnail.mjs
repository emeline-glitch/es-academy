/**
 * Uploade le thumbnail PNG d'une leçon vers Bunny Stream.
 * La leçon doit avoir son bunny_video_id dans le mapping (vidéo déjà uploadée).
 *
 * Usage : node scripts/upload-thumbnail.mjs M01-A           (un seul)
 *         node scripts/upload-thumbnail.mjs --all-uploaded   (toutes celles dont la vidéo est sur Bunny)
 */

import fs from "node:fs";
import path from "node:path";

const MAPPING_PATH = "scripts/data/lessons-mapping.json";
const THUMB_DIR = "scripts/data/thumbnails";

const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = process.env.BUNNY_STREAM_API_KEY;
if (!libraryId || !apiKey) {
  console.error("Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY in env.");
  process.exit(1);
}

async function uploadOne(code) {
  const [, modStr, letter] = code.match(/^M(\d{2})-([A-Z])$/);
  const moduleOrder = parseInt(modStr, 10);
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
  const moduleData = mapping.modules.find((m) => m.order === moduleOrder);
  const lesson = moduleData?.lessons.find((l) => l.letter === letter);
  if (!lesson) { console.error(`${code} introuvable dans le mapping.`); return false; }
  if (!lesson.bunny_video_id) {
    console.log(`   ⚠️  ${code} : pas de bunny_video_id (vidéo pas uploadée). Skip.`);
    return false;
  }
  const pngPath = path.join(THUMB_DIR, `${code}.png`);
  if (!fs.existsSync(pngPath)) {
    console.error(`   ❌ ${code} : thumbnail PNG introuvable (${pngPath})`);
    return false;
  }
  const png = fs.readFileSync(pngPath);
  const url = `https://video.bunnycdn.com/library/${libraryId}/videos/${lesson.bunny_video_id}/thumbnail`;
  const res = await fetch(url, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "image/png" },
    body: png,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`   ❌ ${code} : Bunny ${res.status} ${res.statusText} — ${txt}`);
    return false;
  }
  lesson.bunny_thumbnail_uploaded_at = new Date().toISOString();
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n");
  console.log(`   ✓ ${code} → thumbnail uploadée`);
  return true;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/upload-thumbnail.mjs M01-A | --all-uploaded");
  process.exit(1);
}

if (arg === "--all-uploaded") {
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
  let count = 0, ok = 0;
  for (const mod of mapping.modules) {
    for (const l of mod.lessons) {
      if (!l.bunny_video_id) continue;
      const code = `M${String(mod.order).padStart(2, "0")}-${l.letter}`;
      count++;
      if (await uploadOne(code)) ok++;
    }
  }
  console.log(`\n✅ ${ok}/${count} thumbnails uploadées.`);
} else {
  await uploadOne(arg);
}
