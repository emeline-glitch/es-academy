import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter(l => l && !l.startsWith("#") && l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i+1)]; }));
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Test all combos
for (const col of ["trigger_event", "trigger_type", "trigger_value", "trigger_tag"]) {
  const { error } = await s.from("email_sequences").select(col).limit(1);
  console.log(`${col}: ${error ? "❌ " + error.message : "✅ exists"}`);
}
