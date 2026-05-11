const slug = "10-astuces-incontournables-pour-ameliorer-son-airbnb";
const BLOG_DB = process.env.NOTION_BLOG_DB;
const API_KEY = process.env.NOTION_API_KEY;
console.log("BLOG_DB:", BLOG_DB ? BLOG_DB.slice(0, 8) + "..." : "MISSING");
console.log("API_KEY:", API_KEY ? "present" : "MISSING");

// 1. Find article by slug
const r1 = await fetch(`https://api.notion.com/v1/databases/${BLOG_DB}/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
  body: JSON.stringify({ filter: { property: "slug", rich_text: { equals: slug } } }),
});
console.log("\nQuery status:", r1.status);
const d1 = await r1.json();
console.log("Results:", d1.results?.length || 0);
if (!d1.results?.[0]) { console.log(JSON.stringify(d1).slice(0, 300)); process.exit(1); }

const pageId = d1.results[0].id;
console.log("Page ID:", pageId);

// 2. Get blocks
const r2 = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
  headers: { Authorization: `Bearer ${API_KEY}`, "Notion-Version": "2022-06-28" },
});
console.log("\nBlocks status:", r2.status);
const d2 = await r2.json();
console.log("Blocks count:", d2.results?.length || 0);
if (d2.results?.length) {
  console.log("\nFirst 5 blocks (type / has_children / partial content):");
  for (const b of d2.results.slice(0, 5)) {
    const partial = JSON.stringify(b[b.type] || {}).slice(0, 120);
    console.log(`  - ${b.type.padEnd(20)} children=${b.has_children} | ${partial}`);
  }
} else {
  console.log("ERROR body:", JSON.stringify(d2).slice(0, 500));
}
