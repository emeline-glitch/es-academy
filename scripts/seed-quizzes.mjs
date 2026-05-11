#!/usr/bin/env node
// Seed des 117 questions + ~350 options dans Supabase depuis quizzes-with-answers.json
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Charge .env.local sans dépendance externe
const envText = readFileSync("/Users/emeline/es-academy/.env.local", "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const data = JSON.parse(
  readFileSync("/Users/emeline/es-academy/scripts/data/quizzes-with-answers.json", "utf-8")
);

const DRY = process.env.DRY_RUN === "1";

// Mode reset : on vide d'abord les deux tables (options cascade auto avec FK on delete).
console.log("→ Nettoyage tables quiz_questions / quiz_options...");
if (!DRY) {
  const { error: delErr } = await supabase
    .from("quiz_questions")
    .delete()
    .neq("question_code", "__dummy__");
  if (delErr) {
    console.error("Erreur DELETE :", delErr.message);
    process.exit(1);
  }
}

let totalQ = 0;
let totalO = 0;

for (const mod of data.modules) {
  for (const lesson of mod.lessons) {
    let qOrder = 1;
    for (const q of lesson.questions) {
      const insertQ = {
        question_code: q.code,
        lesson_code: lesson.code,
        module_code: mod.module,
        question_text: q.text,
        question_type: q.type,
        sort_order: qOrder++,
        published: true,
      };

      if (DRY) {
        console.log("DRY", insertQ.question_code, q.options.length, "options");
        totalQ++;
        totalO += q.options.length;
        continue;
      }

      const { data: qRow, error: qErr } = await supabase
        .from("quiz_questions")
        .insert(insertQ)
        .select("id")
        .single();
      if (qErr) {
        console.error(`Erreur insert Q ${q.code} :`, qErr.message);
        process.exit(1);
      }

      const options = q.options.map((o, idx) => ({
        question_id: qRow.id,
        option_text: o.text,
        is_correct: o.is_correct,
        explanation: o.explanation || null,
        sort_order: idx + 1,
      }));

      const { error: oErr } = await supabase.from("quiz_options").insert(options);
      if (oErr) {
        console.error(`Erreur insert options ${q.code} :`, oErr.message);
        process.exit(1);
      }

      totalQ++;
      totalO += options.length;
      if (totalQ % 20 === 0) console.log(`  ${totalQ} questions seedées...`);
    }
  }
}

console.log(`\n✓ Seed terminé : ${totalQ} questions + ${totalO} options`);
