#!/usr/bin/env node
/**
 * Seed Sprint 3 : SEQ_NM (nurture maître) + SEQ_CV (cahier vacances) + SEQ_CO (chasse oeufs).
 * Idempotent.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { ALL_SEQUENCES_SPRINT3 } from "./seed-sprint3-data.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 3");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

for (const seq of ALL_SEQUENCES_SPRINT3) {
  console.log(`\n▸ ${seq.name}`);

  const { data: existing } = await supabase
    .from("email_sequences")
    .select("id")
    .eq("name", seq.name)
    .maybeSingle();

  let seqId;
  if (existing) {
    seqId = existing.id;
    console.log(`  ℹ️  Existe déjà (id: ${seqId})`);
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
    console.log(`  ✅ Créée (id: ${seqId})`);
  }

  const { data: existingSteps } = await supabase
    .from("email_sequence_steps")
    .select("step_order")
    .eq("sequence_id", seqId);

  if (existingSteps && existingSteps.length >= seq.steps.length) {
    console.log(`    └ ${existingSteps.length} steps déjà présents, skip`);
    continue;
  }

  for (const step of seq.steps) {
    const { error } = await supabase.from("email_sequence_steps").insert({
      sequence_id: seqId,
      ...step,
    });
    if (error) {
      console.log(`    └ ❌ step ${step.step_order} : ${error.message}`);
    } else {
      console.log(`    └ ✅ step ${step.step_order} · ${step.subject.slice(0, 55)}…`);
    }
  }
}

// Relier le lead magnet cahier-vacances à SEQ_CV
const { data: seqCv } = await supabase
  .from("email_sequences")
  .select("id")
  .eq("name", "Welcome Cahier de vacances (SEQ_CV)")
  .maybeSingle();
if (seqCv) {
  await supabase
    .from("lead_magnets")
    .update({ welcome_sequence_id: seqCv.id })
    .eq("slug", "cahier-vacances");
  console.log("\n✅ cahier-vacances → SEQ_CV lié");
}

const { data: seqCo } = await supabase
  .from("email_sequences")
  .select("id")
  .eq("name", "Welcome Chasse aux oeufs (SEQ_CO)")
  .maybeSingle();
if (seqCo) {
  await supabase
    .from("lead_magnets")
    .update({ welcome_sequence_id: seqCo.id })
    .eq("slug", "chasse-oeufs");
  console.log("✅ chasse-oeufs → SEQ_CO lié");
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SEED SPRINT 3 TERMINÉ");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
