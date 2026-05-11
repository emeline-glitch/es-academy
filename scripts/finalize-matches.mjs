#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const matches = JSON.parse(readFileSync("/tmp/matches.json", "utf-8"));
const notion = JSON.parse(readFileSync("/tmp/notion-blog-pages.json", "utf-8"));
const drive = JSON.parse(readFileSync("/tmp/drive-articles.json", "utf-8"));

// Ajoute les 2 matches evidents (Jaccard sous le seuil mais titre tres proche).
const manualMatches = [
  { notion_slug: "assurance-emprunteur-guide-complet", drive_title: "Quest-ce_que_lassurance_emprunteur_en_2023_V2.docx" },
  { notion_slug: "maitriser-art-investissement-locatif", drive_title: "Maîtriser_lart_de_linvestissement_locatif_V2.docx" },
];

for (const m of manualMatches) {
  const np = notion.find((p) => p.slug === m.notion_slug);
  const df = drive.find((d) => d.title === m.drive_title);
  if (np && df) {
    matches.push({
      notion_id: np.id,
      notion_title: np.title,
      notion_slug: np.slug,
      drive_id: df.id,
      drive_title: df.title,
      score: "1.00 (manual)",
    });
  }
}

writeFileSync("/tmp/matches.json", JSON.stringify(matches, null, 2));
console.log(`Total matches: ${matches.length}`);
