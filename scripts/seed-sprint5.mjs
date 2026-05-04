#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { ALL_SEQUENCES_SPRINT5 } from "./seed-sprint5-data.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  console.error("Usage: node --env-file=.env.local scripts/seed-sprint5.mjs");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 5 (post-achat Academy)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

for (const seq of ALL_SEQUENCES_SPRINT5) {
  console.log(`\n▸ ${seq.name}`);
  const { data: existing } = await supabase
    .from("email_sequences")
    .select("id")
    .eq("name", seq.name)
    .maybeSingle();

  let seqId;
  if (existing) {
    seqId = existing.id;
    console.log(`  ℹ️  Existe déjà (${seqId})`);
  } else {
    const { data, error } = await supabase
      .from("email_sequences")
      .insert({
        name: seq.name,
        trigger_type: seq.trigger_type,
        trigger_value: seq.trigger_value,
        status: seq.status,
      })
      .select()
      .single();
    if (error) {
      console.log(`  ❌ ${error.message}`);
      continue;
    }
    seqId = data.id;
    console.log(`  ✅ Créée (${seqId})`);
  }

  const { data: existingSteps } = await supabase
    .from("email_sequence_steps")
    .select("step_order")
    .eq("sequence_id", seqId);

  if (existingSteps && existingSteps.length >= seq.steps.length) {
    console.log(`    └ ${existingSteps.length} steps déjà présents (skip)`);
    continue;
  }

  for (const step of seq.steps) {
    const { error } = await supabase
      .from("email_sequence_steps")
      .insert({ sequence_id: seqId, ...step });
    if (error) {
      console.log(`    └ ❌ step ${step.step_order} : ${error.message}`);
    } else {
      console.log(`    └ ✅ step ${step.step_order} (J+${step.delay_days}) · ${step.subject.slice(0, 55)}…`);
    }
  }
}

console.log("\n✅ SEED SPRINT 5 terminé");
console.log("\n⚠️  RAPPELS POST-SEED :");
console.log("  1. Calendly Antony (mail 6) = PLACEHOLDER 'X'. À remplacer dans email_sequence_steps quand Antony aura activé son compte.");
console.log("  2. Sequence créée en status 'draft'. La passer en 'active' depuis /admin/sequences après review.");
console.log("");
