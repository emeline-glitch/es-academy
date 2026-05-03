import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false } });

const candidates = ["email_templates", "templates", "messages", "emails"];
let table = null;
for (const t of candidates) {
  const { data, error } = await supa.from(t).select("id").limit(1);
  if (!error) { table = t; break; }
}
if (!table) {
  console.error("Aucune des tables candidates trouvée:", candidates.join(", "));
  process.exit(1);
}
console.log(`Table détectée: ${table}`);

const { data, error } = await supa
  .from(table)
  .select("*")
  .or("from_email.ilike.%es-academy.fr%,from_email.ilike.%@es-academy%");

if (error) {
  console.error("Erreur SELECT:", error.message);
  process.exit(1);
}

console.log(`\nTemplates avec from_email contenant 'es-academy.fr': ${data.length}`);
for (const row of data) {
  const display = {
    id: row.id,
    slug: row.slug || row.name || row.template_key || "?",
    from_email: row.from_email,
    from_name: row.from_name,
    subject: (row.subject || "").slice(0, 60),
  };
  console.log("  -", display);
}
