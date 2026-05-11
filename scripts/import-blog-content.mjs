#!/usr/bin/env node
import { readFileSync } from "fs";

const API_KEY = process.env.NOTION_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";
const LIMIT = parseInt(process.env.LIMIT || "0", 10) || 999;

// Charge le mapping
const matches = JSON.parse(readFileSync("/tmp/matches.json", "utf-8"));

// Filtre : ne traite que ceux qui ont un contenu Drive prêt en cache local
// Cache : /tmp/drive-content/<file_id>.txt
const fs = await import("fs");
const cacheDir = "/tmp/drive-content";
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const ready = matches.filter((m) => fs.existsSync(`${cacheDir}/${m.drive_id}.txt`));
console.log(`Articles avec contenu en cache : ${ready.length}/${matches.length}`);

if (ready.length === 0) {
  console.log("\nAucun article en cache. Lance d'abord le download Drive (autre script).");
  process.exit(0);
}

// Parser markdown -> blocs Notion. Limites Notion : 100 blocks/request, 2000 chars/rich_text.
function parseMarkdownToBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let inSkipSection = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\r$/, "");

    // Skip everything from [META DESCRIPTION SEO] to fin de bloc
    // ou apres [NOTES SEO INTERNES
    if (line.includes("[NOTES SEO INTERNES")) break;
    if (line.includes("[META DESCRIPTION SEO]")) continue;

    line = line.trim();
    // Ignore les lignes vides
    if (!line) continue;

    // Le title du fichier (1ere ligne, finit par "!") -> ignore (deja le title Notion)
    if (i < 3 && /^[A-Z0-9]/.test(line) && !line.startsWith("##")) {
      // Heuristique : la premiere ligne en haut sans ## est probablement le titre.
      // On le skip seulement si i==0
      if (i === 0) continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }] },
      });
      continue;
    }
    // Heading 3
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }] },
      });
      continue;
    }

    // Paragraph (avec parsing inline des liens [texte](url) et **bold**)
    const richText = parseInline(line);
    if (richText.length > 0) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: richText },
      });
    }
  }

  return blocks;
}

// Parse inline : detecte [texte](url) et **bold**.
function parseInline(text) {
  const out = [];
  // Regex pour split par link + bold
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      out.push({ type: "text", text: { content: plain.slice(0, 2000) } });
    }
    if (m[1] !== undefined) {
      // Link
      out.push({
        type: "text",
        text: { content: m[1].slice(0, 2000), link: { url: m[2] } },
      });
    } else if (m[3] !== undefined) {
      // Bold
      out.push({
        type: "text",
        text: { content: m[3].slice(0, 2000) },
        annotations: { bold: true },
      });
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push({ type: "text", text: { content: text.slice(last, last + 2000) } });
  }
  return out;
}

async function appendBlocks(pageId, blocks) {
  // Append par chunks de 100 (limite Notion API)
  for (let i = 0; i < blocks.length; i += 100) {
    const chunk = blocks.slice(i, i + 100);
    const r = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ children: chunk }),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Notion API ${r.status}: ${err.slice(0, 300)}`);
    }
  }
}

let imported = 0;
let failed = 0;
for (const m of ready.slice(0, LIMIT)) {
  const text = fs.readFileSync(`${cacheDir}/${m.drive_id}.txt`, "utf-8");
  const blocks = parseMarkdownToBlocks(text);
  process.stdout.write(`  ${m.notion_slug.padEnd(60)} (${blocks.length} blocks) `);

  if (DRY_RUN) {
    console.log("[DRY_RUN]");
    imported++;
    continue;
  }

  try {
    await appendBlocks(m.notion_id, blocks);
    console.log("✓");
    imported++;
  } catch (e) {
    console.log("✗ " + e.message);
    failed++;
  }
  // Rate limit Notion : 3 req/sec
  await new Promise((r) => setTimeout(r, 350));
}

console.log(`\nImportes : ${imported}`);
console.log(`Echoues  : ${failed}`);
