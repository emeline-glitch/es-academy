import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = createClient(url, key, { auth: { persistSession: false } });

const tables = ["enrollments", "academy_enrollments", "purchases"];
let table = null;
for (const t of tables) {
  const { error } = await supa.from(t).select("id").limit(1);
  if (!error) { table = t; break; }
}
if (!table) { console.error("Aucune table enrollment trouvée"); process.exit(1); }

const { data, error } = await supa
  .from(table)
  .select("*")
  .limit(50);

if (error) { console.error("SELECT err:", error.message); process.exit(1); }

console.log(`Table: ${table} - 3 derniers enrollments:\n`);
for (const e of data) {
  const safe = { ...e };
  // Masque champs potentiellement sensibles
  if (safe.gift_code) safe.gift_code = `${safe.gift_code.slice(0, 6)}...`;
  console.log(safe);
  console.log("---");
}
