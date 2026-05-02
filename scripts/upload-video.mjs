import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const code = process.argv[2];
if (!code || !/^M\d{2}-[A-Z]$/.test(code)) {
  console.error('Usage: node scripts/upload-video.mjs M01-A');
  process.exit(1);
}

const VIDEO_DIR = path.join(process.env.HOME, "es-academy-videos");
const MAPPING_PATH = "scripts/data/lessons-mapping.json";
const filePath = path.join(VIDEO_DIR, `${code}.mp4`);

const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = process.env.BUNNY_STREAM_API_KEY;
if (!libraryId || !apiKey) {
  console.error("Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY in env.");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Fichier introuvable : ${filePath}`);
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
const [, modStr, letter] = code.match(/^M(\d{2})-([A-Z])$/);
const moduleOrder = parseInt(modStr, 10);
const module = mapping.modules.find((m) => m.order === moduleOrder);
if (!module) { console.error(`Module ${moduleOrder} introuvable dans le mapping.`); process.exit(1); }
const lesson = module.lessons.find((l) => l.letter === letter);
if (!lesson) { console.error(`Leçon ${code} introuvable dans le mapping.`); process.exit(1); }

if (lesson.bunny_video_id) {
  console.log(`⚠️  ${code} déjà uploadé sur Bunny (videoId=${lesson.bunny_video_id}). Skip.`);
  console.log(`   Embed : https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}`);
  process.exit(0);
}

const stats = await stat(filePath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
const title = `${code} — ${lesson.name}`;

console.log(`📹 ${code}  ${title}`);
console.log(`   ${sizeMB} MB`);

console.log(`\n[1/2] Création video Bunny…`);
const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
  method: "POST",
  headers: { AccessKey: apiKey, "Content-Type": "application/json", accept: "application/json" },
  body: JSON.stringify({ title }),
});
if (!createRes.ok) {
  console.error(`Bunny create failed: ${createRes.status} ${createRes.statusText}`);
  console.error(await createRes.text());
  process.exit(1);
}
const created = await createRes.json();
const videoId = created.guid;
console.log(`   ✓ videoId = ${videoId}`);

console.log(`\n[2/2] Upload binaire (${sizeMB} MB) via curl…`);
const startedAt = Date.now();
const uploadCode = await new Promise((resolve, reject) => {
  const args = [
    "-sS",
    "-X", "PUT",
    "--progress-bar",
    "-H", `AccessKey: ${apiKey}`,
    "-H", "Content-Type: application/octet-stream",
    "--data-binary", `@${filePath}`,
    "-o", "/dev/null",
    "-w", "%{http_code}",
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
  ];
  const child = spawn("curl", args, { stdio: ["ignore", "pipe", "inherit"] });
  let httpCode = "";
  child.stdout.on("data", (d) => (httpCode += d.toString()));
  child.on("error", reject);
  child.on("close", () => resolve(parseInt(httpCode.trim(), 10)));
});
if (uploadCode !== 200 && uploadCode !== 201) {
  console.error(`Bunny upload failed: HTTP ${uploadCode}`);
  process.exit(1);
}
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
console.log(`   ✓ upload OK en ${elapsed}s (HTTP ${uploadCode})`);

console.log(`\n[3/3] Vérification statut Bunny…`);
await new Promise((r) => setTimeout(r, 5000));
const checkRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
  headers: { AccessKey: apiKey, accept: "application/json" },
});
const info = await checkRes.json();
const statusLabel = ["Queued","Uploaded","Processing","Transcoding","Finished","Error","UploadFailed","JitSegmenting","JitPlaylistsCreated"][info.status] || `?(${info.status})`;
console.log(`   length=${info.length}s  status=${info.status} (${statusLabel})  encodeProgress=${info.encodeProgress || 0}%`);
if (info.status === 5 || info.status === 6) {
  console.error(`\n❌ Upload échoué côté Bunny (status=${info.status}).`);
  process.exit(1);
}

lesson.bunny_video_id = videoId;
lesson.bunny_uploaded_at = new Date().toISOString();
fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n");
console.log(`   ✓ mapping JSON mis à jour\n`);

console.log(`Terminé ✅`);
console.log(`   Embed iframe : https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`);
console.log(`   Bunny dashboard : https://dash.bunny.net/stream/${libraryId}/library`);
console.log(`\nNote : Bunny encode la vidéo en arrière-plan (HLS multi-bitrate). Compter ~5 min/vidéo.`);
console.log(`Tu peux déjà jeter ${filePath} à la corbeille pour libérer de la place.`);
