#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const quizzes = JSON.parse(readFileSync("/Users/emeline/es-academy/scripts/data/quizzes-learnybox.json", "utf-8"));
const csvText = readFileSync("/Users/emeline/es-academy/scripts/data/lessons-mapping.csv", "utf-8");

// Parse CSV (simple : pas de quote dans les champs sauf module_notion_name + lesson_name).
function parseCsv(text) {
  const lines = text.split("\n").filter(Boolean);
  const header = lines[0].split(",");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split avec quote-aware
    const cells = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    const row = {};
    header.forEach((h, idx) => (row[h] = cells[idx] || ""));
    rows.push(row);
  }
  return rows;
}

const lessons = parseCsv(csvText);

// Index quiz par idpage
const quizByPage = new Map();
for (const q of quizzes) quizByPage.set(String(q.idpage), q);

// Group lessons par module_notion_name
const byModule = new Map();
for (const l of lessons) {
  const mod = l.module_notion_name;
  if (!byModule.has(mod)) byModule.set(mod, []);
  byModule.get(mod).push(l);
}

const out = [];
out.push("# Quiz ES Academy - Bonnes réponses à marquer");
out.push("");
out.push("**Instructions Emeline / Claude Chat :**");
out.push("");
out.push("Pour chaque question, mets `✅` devant la (les) bonne(s) réponse(s). Exemple :");
out.push("");
out.push("```");
out.push("**Q1. Comment avoir un bon mindset ?**");
out.push("- ✅ Trouver son pourquoi");
out.push("- Se libérer des croyances limitantes  ← (à laisser tel quel si fausse)");
out.push("- ✅ Rester motivé au quotidien");
out.push("```");
out.push("");
out.push("Quand tu as fini, sauve le fichier et redonne-le-moi : je push tout dans Notion + j'implémente le QuizForm sur le site.");
out.push("");
out.push("---");
out.push("");

let totalQ = 0;
let totalLessonsWithQuiz = 0;
let totalLessonsWithoutQuiz = 0;

for (const [moduleName, modLessons] of byModule) {
  out.push(`## ${moduleName}`);
  out.push("");
  for (const l of modLessons.sort((a, b) => Number(a.lesson_order) - Number(b.lesson_order))) {
    const q = quizByPage.get(l.evermind_idpage);
    out.push(`### Leçon ${l.lesson_letter}. ${l.lesson_name}`);
    if (!q || !q.ok || !q.questions || q.questions.length === 0) {
      out.push("");
      out.push("_Pas de quiz pour cette leçon._");
      out.push("");
      totalLessonsWithoutQuiz++;
      continue;
    }
    totalLessonsWithQuiz++;
    out.push("");
    for (const question of q.questions) {
      totalQ++;
      out.push(`**Q${question.num}. ${question.question}**`);
      for (const c of question.choices) {
        out.push(`- ${c}`);
      }
      out.push("");
    }
    out.push("---");
    out.push("");
  }
}

out.unshift("");
out.unshift(`> **Stats** : ${totalLessonsWithQuiz} leçons avec quiz · ${totalQ} questions · ${totalLessonsWithoutQuiz} leçons sans quiz`);
out.unshift("");

writeFileSync("/Users/emeline/Downloads/quiz-bonnes-reponses-a-marquer.md", out.join("\n"));
console.log(`Doc généré : /Users/emeline/Downloads/quiz-bonnes-reponses-a-marquer.md`);
console.log(`  - ${totalLessonsWithQuiz} leçons avec quiz`);
console.log(`  - ${totalQ} questions au total`);
console.log(`  - ${totalLessonsWithoutQuiz} leçons sans quiz`);
