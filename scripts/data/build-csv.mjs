import fs from "node:fs";
const m = JSON.parse(fs.readFileSync("scripts/data/lessons-mapping.json", "utf8"));
const out = ["module_order,module_notion_slug,module_notion_name,lesson_order,lesson_letter,lesson_name,evermind_idpage,bunny_video_id,notion_lesson_id"];
let total = 0;
for (const mod of m.modules) {
  for (const l of mod.lessons) {
    const safe = (s) => `"${String(s).replaceAll('"', '""')}"`;
    out.push([
      mod.order,
      mod.notion_slug,
      safe(mod.notion_name),
      l.order,
      l.letter,
      safe(l.name),
      l.evermind_idpage,
      "",
      "",
    ].join(","));
    total++;
  }
}
fs.writeFileSync("scripts/data/lessons-mapping.csv", out.join("\n") + "\n");
console.log(`CSV créé avec ${total} leçons sur ${m.modules.length} modules.`);
