import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = createClient(url, key, { auth: { persistSession: false } });

const { data: sequences, error } = await supa
  .from("email_sequences")
  .select("id, name, trigger_type, trigger_value, status");

if (error) { console.error("Error:", error.message); process.exit(1); }

console.log(`${sequences.length} séquences en DB:\n`);
for (const seq of sequences) {
  const { count } = await supa
    .from("email_sequence_steps")
    .select("id", { count: "exact", head: true })
    .eq("sequence_id", seq.id);
  console.log(`  - ${seq.name}`);
  console.log(`    trigger: ${seq.trigger_type}=${seq.trigger_value} | status: ${seq.status} | steps: ${count}`);
}
