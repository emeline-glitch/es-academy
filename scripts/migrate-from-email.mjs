import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false } });

const OLD = "emeline@es-academy.fr";
const NEW = "emeline@emeline-siron.fr";

const { data: before, error: e1 } = await supa
  .from("email_templates")
  .select("id, from_email")
  .eq("from_email", OLD);

if (e1) {
  console.error("SELECT before failed:", e1.message);
  process.exit(1);
}

console.log(`Avant migration: ${before.length} templates avec from_email=${OLD}`);

if (before.length === 0) {
  console.log("Rien à migrer.");
  process.exit(0);
}

const { error: eUp, count } = await supa
  .from("email_templates")
  .update({ from_email: NEW }, { count: "exact" })
  .eq("from_email", OLD);

if (eUp) {
  console.error("UPDATE failed:", eUp.message);
  process.exit(1);
}

console.log(`UPDATE OK (${count} rows) -> from_email=${NEW}`);

const { data: after } = await supa
  .from("email_templates")
  .select("id")
  .eq("from_email", OLD);

console.log(`Après migration: ${after.length} templates encore en ${OLD} (devrait être 0)`);
