#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { ALL_SEQUENCES_SPRINT4 } from "./seed-sprint4-data.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l && !l.startsWith("#") && l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 4 (séquences comportementales)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

for (const seq of ALL_SEQUENCES_SPRINT4) {
  console.log(`\n▸ ${seq.name}`);
  const { data: existing } = await supabase.from("email_sequences").select("id").eq("name", seq.name).maybeSingle();

  let seqId;
  if (existing) {
    seqId = existing.id;
    console.log(`  ℹ️  Existe déjà`);
  } else {
    const { data, error } = await supabase.from("email_sequences").insert({
      name: seq.name,
      trigger_type: seq.trigger_type,
      trigger_value: seq.trigger_value,
      status: seq.status,
    }).select().single();
    if (error) { console.log(`  ❌ ${error.message}`); continue; }
    seqId = data.id;
    console.log(`  ✅ Créée`);
  }

  const { data: existingSteps } = await supabase.from("email_sequence_steps").select("step_order").eq("sequence_id", seqId);
  if (existingSteps && existingSteps.length >= seq.steps.length) {
    console.log(`    └ ${existingSteps.length} steps déjà présents`);
    continue;
  }

  for (const step of seq.steps) {
    const { error } = await supabase.from("email_sequence_steps").insert({ sequence_id: seqId, ...step });
    if (error) console.log(`    └ ❌ ${step.step_order} : ${error.message}`);
    else console.log(`    └ ✅ ${step.step_order} · ${step.subject.slice(0, 55)}…`);
  }
}

console.log("\n✅ SEED SPRINT 4 terminé\n");
