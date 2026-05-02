/**
 * Génère un PNG 1280x720 de thumbnail pour une leçon donnée.
 * Utilise Chrome headless (déjà installé sur macOS).
 *
 * Usage : node scripts/generate-thumbnail.mjs M01-A          (un seul)
 *         node scripts/generate-thumbnail.mjs --all            (les 66)
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MAPPING_PATH = "scripts/data/lessons-mapping.json";
const OUT_DIR = path.resolve("scripts/data/thumbnails");

if (!fs.existsSync(CHROME)) {
  console.error(`Google Chrome introuvable : ${CHROME}`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

function buildHtml({ moduleOrder, moduleTitle, letter }) {
  const moduleNum = String(moduleOrder).padStart(2, "0");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@600;700&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1280px; height: 720px; overflow: hidden; background: #1B4332; }
.thumb {
  position: absolute;
  top: 0; left: 0;
  width: 1280px; height: 720px;
  background: #1B4332;
  color: #F5F0E8;
  font-family: Inter, system-ui, sans-serif;
  overflow: hidden;
}
.top {
  position: absolute;
  top: 56px; left: 96px; right: 96px;
  display: flex; align-items: baseline; gap: 20px;
}
.module-num {
  font-family: Inter;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #F5F0E8;
  opacity: 0.6;
}
.rule {
  flex: 1;
  height: 1px;
  background: #F5F0E8;
  opacity: 0.2;
  align-self: center;
}
.module-title {
  position: absolute;
  top: 50%;
  left: 96px;
  transform: translateY(-50%);
  font-family: 'Playfair Display', serif;
  font-size: 108px;
  line-height: 1;
  font-weight: 700;
  color: #F5F0E8;
  max-width: 820px;
  letter-spacing: -0.01em;
}
.lesson-letter {
  font-family: 'Playfair Display', serif;
  font-size: 320px;
  line-height: 0.8;
  font-weight: 400;
  color: #F5F0E8;
  opacity: 0.07;
  position: absolute;
  right: 80px;
  top: -40px;
  user-select: none;
}
.play-overlay {
  position: absolute;
  right: 110px;
  top: 50%;
  transform: translateY(-30%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #F5F0E8;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
}
.play-overlay::before {
  content: '';
  width: 0; height: 0;
  border-left: 36px solid #1B4332;
  border-top: 24px solid transparent;
  border-bottom: 24px solid transparent;
  margin-left: 10px;
}
.bottom {
  position: absolute;
  top: 600px;
  left: 96px;
  right: 96px;
  display: flex; justify-content: space-between; align-items: flex-end;
}
.brand {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-style: italic;
  font-weight: 400;
  color: #F5F0E8;
  opacity: 0.85;
}
.brand strong { font-style: normal; font-weight: 700; letter-spacing: 0.04em; }
</style>
</head>
<body>
<div class="thumb">
  <div class="lesson-letter">${letter}</div>
  <div class="top">
    <span class="module-num">Module ${moduleNum}</span>
    <span class="rule"></span>
  </div>
  <h1 class="module-title">${moduleTitle}</h1>
  <div class="play-overlay"></div>
  <div class="bottom">
    <span class="brand">La méthode <strong>Emeline SIRON</strong></span>
  </div>
</div>
</body>
</html>`;
}

async function generateOne(code) {
  const [, modStr, letter] = code.match(/^M(\d{2})-([A-Z])$/);
  const moduleOrder = parseInt(modStr, 10);
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
  const moduleData = mapping.modules.find((m) => m.order === moduleOrder);
  if (!moduleData) throw new Error(`Module ${moduleOrder} introuvable`);
  const lesson = moduleData.lessons.find((l) => l.letter === letter);
  if (!lesson) throw new Error(`Leçon ${code} introuvable`);

  const moduleTitle = moduleData.notion_name.replace(/^Module \d+\s*[—-]\s*/, "");
  const html = buildHtml({ moduleOrder, moduleTitle, letter });
  const tmpHtml = path.join("/tmp", `thumb-${code}.html`);
  const outPng = path.join(OUT_DIR, `${code}.png`);
  fs.writeFileSync(tmpHtml, html);

  await new Promise((resolve, reject) => {
    const args = [
      "--headless",
      `--screenshot=${outPng}`,
      "--window-size=1280,720",
      "--hide-scrollbars",
      "--disable-gpu",
      "--virtual-time-budget=3000",
      "--force-device-scale-factor=1",
      `file://${tmpHtml}`,
    ];
    const child = spawn(CHROME, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Chrome exit ${code}`))));
  });
  // Garder tmpHtml pour debug si KEEP_HTML
  if (!process.env.KEEP_HTML) fs.unlinkSync(tmpHtml);
  console.log(`   ✓ ${code} → ${outPng}`);
  return outPng;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/generate-thumbnail.mjs M01-A | --all");
  process.exit(1);
}

if (arg === "--all") {
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
  let count = 0;
  for (const mod of mapping.modules) {
    for (const l of mod.lessons) {
      const code = `M${String(mod.order).padStart(2, "0")}-${l.letter}`;
      await generateOne(code);
      count++;
    }
  }
  console.log(`\n✅ ${count} thumbnails générées dans ${OUT_DIR}`);
} else {
  await generateOne(arg);
  console.log(`\nOuvre le fichier pour voir : open ${path.join(OUT_DIR, `${arg}.png`)}`);
}
