/**
 * Crée/synchronise la structure Notion pour une leçon donnée :
 * - Course parent (créé si manquant)
 * - Modules (relation Course mise à jour si manquante)
 * - Leçon (créée avec videoId, ou skip si existe déjà avec même slug)
 *
 * Usage : node scripts/notion-create-lesson.mjs M01-A
 */

import fs from "node:fs";
import path from "node:path";

const code = process.argv[2];
if (!code || !/^M\d{2}-[A-Z]$/.test(code)) {
  console.error("Usage: node scripts/notion-create-lesson.mjs M01-A");
  process.exit(1);
}

const NOTION = "https://api.notion.com/v1";
const headers = {
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};
const COURSES_DB = process.env.NOTION_COURSES_DB;
const MODULES_DB = process.env.NOTION_MODULES_DB;
const LESSONS_DB = process.env.NOTION_LESSONS_DB;
if (!COURSES_DB || !MODULES_DB || !LESSONS_DB) {
  console.error("Missing NOTION_*_DB env vars.");
  process.exit(1);
}

const MAPPING_PATH = "scripts/data/lessons-mapping.json";
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
const [, modStr, letter] = code.match(/^M(\d{2})-([A-Z])$/);
const moduleOrder = parseInt(modStr, 10);
const moduleData = mapping.modules.find((m) => m.order === moduleOrder);
const lessonData = moduleData?.lessons.find((l) => l.letter === letter);
if (!moduleData || !lessonData) {
  console.error(`Mapping introuvable pour ${code}`);
  process.exit(1);
}
if (!lessonData.bunny_video_id) {
  console.error(`${code} n'a pas de bunny_video_id (la vidéo n'est pas uploadée).`);
  process.exit(1);
}

async function queryDb(dbId, filter) {
  const res = await fetch(`${NOTION}/databases/${dbId}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ filter, page_size: 100 }),
  });
  if (!res.ok) throw new Error(`Notion query ${dbId} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

async function createPage(dbId, properties) {
  const res = await fetch(`${NOTION}/pages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });
  if (!res.ok) throw new Error(`Notion create failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function updatePage(pageId, properties) {
  const res = await fetch(`${NOTION}/pages/${pageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion update failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

const title = (s) => ({ title: [{ text: { content: s } }] });
const rich = (s) => ({ rich_text: [{ text: { content: s } }] });
const num = (n) => ({ number: n });
const check = (b) => ({ checkbox: b });
const rel = (id) => ({ relation: [{ id }] });

// ─────────────── 1. Course parent ───────────────
console.log(`\n[1/3] Course parent…`);
const courseSlug = mapping.course.slug;
const courseName = mapping.course.name;
let courses = await queryDb(COURSES_DB, {
  property: "Slug",
  rich_text: { equals: courseSlug },
});
let course;
if (courses.length === 0) {
  course = await createPage(COURSES_DB, {
    Name: title(courseName),
    Slug: rich(courseSlug),
    Description: rich("La méthode complète pour devenir investisseur immobilier."),
    Published: check(true),
    Order: num(1),
  });
  console.log(`   ✓ créé : ${courseName} (${course.id})`);
} else {
  course = courses[0];
  console.log(`   ✓ existant : ${courseName} (${course.id})`);
}
const courseId = course.id;

// ─────────────── 2. Module : ensure relation Course ───────────────
console.log(`\n[2/3] Module ${moduleData.notion_name}…`);
const modules = await queryDb(MODULES_DB, {
  property: "Slug",
  rich_text: { equals: moduleData.notion_slug },
});
if (modules.length === 0) {
  console.error(`Module slug=${moduleData.notion_slug} introuvable dans Notion.`);
  process.exit(1);
}
const moduleNotion = modules[0];
const currentCourseRel = moduleNotion.properties?.Course?.relation || [];
const hasCourseRel = currentCourseRel.some((r) => r.id === courseId);
if (!hasCourseRel) {
  await updatePage(moduleNotion.id, { Course: rel(courseId) });
  console.log(`   ✓ relation Course mise à jour sur le module`);
} else {
  console.log(`   ✓ relation Course déjà OK`);
}
const moduleId = moduleNotion.id;

// ─────────────── 3. Lesson : créer si pas exist ───────────────
console.log(`\n[3/3] Leçon ${code}…`);
const lessonSlug = code.toLowerCase();
const existing = await queryDb(LESSONS_DB, {
  property: "Slug",
  rich_text: { equals: lessonSlug },
});

let lessonPage;
if (existing.length > 0) {
  lessonPage = existing[0];
  console.log(`   ⚠️  leçon ${lessonSlug} existe déjà, mise à jour Video_ID`);
  await updatePage(lessonPage.id, {
    Video_ID: rich(lessonData.bunny_video_id),
    Module: rel(moduleId),
  });
} else {
  lessonPage = await createPage(LESSONS_DB, {
    Name: title(lessonData.name),
    Slug: rich(lessonSlug),
    Module: rel(moduleId),
    Order: num(lessonData.order),
    Published: check(true),
    Video_ID: rich(lessonData.bunny_video_id),
    Free_Preview: check(false),
  });
  console.log(`   ✓ créée : ${lessonData.name}`);
}

// ─────────────── Update mapping JSON ───────────────
lessonData.notion_lesson_id = lessonPage.id;
fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n");

const url = `https://www.emeline-siron.fr/cours/${courseSlug}/${moduleData.notion_slug}/${lessonSlug}`;
console.log(`\nTerminé ✅`);
console.log(`   URL leçon : ${url}`);
console.log(`   (Disponible une fois Bunny encoding terminé.)`);
