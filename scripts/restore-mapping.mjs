/**
 * Reconstruit lessons-mapping.json depuis Bunny + Notion (sources de vérité).
 * Récupère :
 *  - tous les videos Bunny avec title "MXX-Y ..." → bunny_video_id
 *  - toutes les leçons Notion par slug "mxx-y" → notion_lesson_id
 * Réécrit le mapping en préservant tous les autres champs.
 */

import fs from "node:fs";

const MAPPING_PATH = "scripts/data/lessons-mapping.json";
const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const bunnyKey = process.env.BUNNY_STREAM_API_KEY;
const notionKey = process.env.NOTION_API_KEY;
const LESSONS_DB = process.env.NOTION_LESSONS_DB;

if (!libraryId || !bunnyKey || !notionKey || !LESSONS_DB) {
  console.error("Missing env vars."); process.exit(1);
}

// 1. Bunny: récupérer toutes les vidéos
console.log("[1/3] Récupération vidéos Bunny…");
const bunnyByCode = new Map();
let page = 1;
while (true) {
  const r = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=100`, {
    headers: { AccessKey: bunnyKey, accept: "application/json" },
  });
  const data = await r.json();
  for (const v of data.items || []) {
    const m = v.title?.match(/^(M\d{2}-[A-Z])/);
    if (m) bunnyByCode.set(m[1], { videoId: v.guid, uploadedAt: v.dateUploaded });
  }
  if (!data.items || data.items.length < 100) break;
  page++;
}
console.log(`   ${bunnyByCode.size} vidéos Bunny avec code MXX-Y`);

// 2. Notion: récupérer toutes les leçons
console.log("[2/3] Récupération leçons Notion…");
const notionBySlug = new Map();
let cursor = undefined;
while (true) {
  const body = { page_size: 100 };
  if (cursor) body.start_cursor = cursor;
  const r = await fetch(`https://api.notion.com/v1/databases/${LESSONS_DB}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  for (const p of data.results || []) {
    const slug = p.properties?.Slug?.rich_text?.[0]?.plain_text;
    if (slug) notionBySlug.set(slug, p.id);
  }
  if (!data.has_more) break;
  cursor = data.next_cursor;
}
console.log(`   ${notionBySlug.size} leçons Notion`);

// 3. Reconstruire le mapping
console.log("[3/3] Reconstruction du mapping…");
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
let restored = 0, kept = 0;
for (const mod of mapping.modules) {
  for (const l of mod.lessons) {
    const code = `M${String(mod.order).padStart(2, "0")}-${l.letter}`;
    const slug = code.toLowerCase();
    const bunny = bunnyByCode.get(code);
    const notionId = notionBySlug.get(slug);
    const had = !!l.bunny_video_id;
    if (bunny) {
      l.bunny_video_id = bunny.videoId;
      if (!l.bunny_uploaded_at) l.bunny_uploaded_at = bunny.uploadedAt;
      if (!l.bunny_thumbnail_uploaded_at) l.bunny_thumbnail_uploaded_at = bunny.uploadedAt;
      if (!had) restored++;
      else kept++;
    }
    if (notionId) {
      l.notion_lesson_id = notionId;
    }
  }
}
fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n");
console.log(`\n✅ Mapping restauré : ${kept + restored} leçons avec bunny_video_id (${restored} restaurées)`);
