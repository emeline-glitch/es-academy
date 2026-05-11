#!/usr/bin/env node
const BLOG_DB = process.env.NOTION_BLOG_DB;
const API_KEY = process.env.NOTION_API_KEY;

let allPages = [];
let cursor = undefined;
while (true) {
  const body = { page_size: 100 };
  if (cursor) body.start_cursor = cursor;
  const r = await fetch(`https://api.notion.com/v1/databases/${BLOG_DB}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!d.results) { console.error("ERR:", JSON.stringify(d).slice(0, 200)); process.exit(1); }
  allPages.push(...d.results);
  if (!d.has_more) break;
  cursor = d.next_cursor;
}

console.log("Total Notion pages:", allPages.length);
const out = allPages.map((p) => ({
  id: p.id,
  title: p.properties.Title?.title?.[0]?.plain_text || "",
  slug: p.properties.Slug?.rich_text?.[0]?.plain_text || "",
  published: p.properties.Published?.checkbox || false,
}));
// Save to JSON for next script
import { writeFileSync } from "fs";
writeFileSync("/tmp/notion-blog-pages.json", JSON.stringify(out, null, 2));
console.log("Saved to /tmp/notion-blog-pages.json");
for (const p of out.slice(0, 5)) console.log(`  ${p.slug.padEnd(60)} | ${p.title.slice(0, 50)}`);
console.log(`  ... (${out.length} total, published=${out.filter(p => p.published).length})`);
