import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter(l => l && !l.startsWith("#") && l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i+1)]; }));
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

for (const col of ["id","sequence_id","step_order","delay_hours","subject","html_content","created_at"]) {
  const { error } = await s.from("email_sequence_steps").select(col).limit(1);
  console.log(`steps.${col}: ${error ? "❌ " + error.message : "✅"}`);
}
console.log();
for (const col of ["id","sequence_id","contact_id","status","enrolled_at","current_step","completed_at","next_send_at"]) {
  const { error } = await s.from("email_sequence_enrollments").select(col).limit(1);
  console.log(`enrollments.${col}: ${error ? "❌ " + error.message : "✅"}`);
}
