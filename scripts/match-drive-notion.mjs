#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const driveFiles = JSON.parse(readFileSync("/tmp/drive-articles.json", "utf-8"));
const notionPages = JSON.parse(readFileSync("/tmp/notion-blog-pages.json", "utf-8"));

// Normalise un titre/slug pour comparaison : lowercase, remove accents,
// remove special chars, replace underscores/dashes by spaces, strip V2/V3/.docx, etc.
function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/v2\.docx$/i, "")
    .replace(/v3\.docx$/i, "")
    .replace(/\.docx$/i, "")
    .replace(/[_\-']/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

// Score de similarité : nombre de mots significatifs en commun.
// On filtre les mots <=2 chars (le, la, de, etc.) et on compte les matches.
function scoreSimilarity(a, b) {
  const wordsA = new Set(normalize(a).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalize(b).split(" ").filter((w) => w.length > 2));
  let inter = 0;
  for (const w of wordsA) if (wordsB.has(w)) inter++;
  const union = wordsA.size + wordsB.size - inter;
  return union === 0 ? 0 : inter / union; // Jaccard
}

// Pour chaque page Notion, trouve le best match Drive
const matches = [];
const usedDriveIds = new Set();

for (const np of notionPages) {
  const np_text = (np.slug + " " + np.title).trim();
  const candidates = driveFiles
    .filter((d) => !usedDriveIds.has(d.id))
    .map((d) => ({ d, score: scoreSimilarity(np_text, d.title) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (best && best.score >= 0.4) {
    usedDriveIds.add(best.d.id);
    matches.push({
      notion_id: np.id,
      notion_title: np.title,
      notion_slug: np.slug,
      drive_id: best.d.id,
      drive_title: best.d.title,
      score: best.score.toFixed(2),
    });
  } else {
    matches.push({
      notion_id: np.id,
      notion_title: np.title,
      notion_slug: np.slug,
      drive_id: null,
      drive_title: null,
      score: best?.score?.toFixed(2) ?? "0",
      best_candidate: best?.d?.title,
    });
  }
}

const matched = matches.filter((m) => m.drive_id);
const unmatched = matches.filter((m) => !m.drive_id);
const driveUnused = driveFiles.filter((d) => !usedDriveIds.has(d.id));

console.log(`Notion pages : ${notionPages.length}`);
console.log(`Drive docx   : ${driveFiles.length}`);
console.log(`Matched      : ${matched.length}`);
console.log(`Notion sans match : ${unmatched.length}`);
console.log(`Drive sans match  : ${driveUnused.length}`);

if (unmatched.length > 0) {
  console.log("\n=== NOTION SANS MATCH ===");
  for (const u of unmatched) console.log(`  ${u.notion_slug.padEnd(60)} (best candidate: ${u.best_candidate?.slice(0, 50) || "none"} score=${u.score})`);
}
if (driveUnused.length > 0) {
  console.log("\n=== DRIVE SANS MATCH ===");
  for (const d of driveUnused) console.log(`  ${d.title.slice(0, 80)}`);
}

writeFileSync("/tmp/matches.json", JSON.stringify(matched, null, 2));
console.log(`\nSaved ${matched.length} matches to /tmp/matches.json`);
