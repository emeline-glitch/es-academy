import { createServiceClient } from "@/lib/supabase/server";

interface EmailTemplate {
  key: string;
  subject: string;
  html_content: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
}

/**
 * Charge un template email depuis la DB et interpole les variables {{nom}}.
 * Retourne { subject, html, from_name, from_email, reply_to } prêts à envoyer via SES.
 *
 * Fallback : si le template n'existe pas en DB, retourne null pour que l'appelant
 * puisse utiliser son propre fallback (ou faire échouer proprement).
 */
export async function renderEmailTemplate(
  key: string,
  variables: Record<string, string | number | null | undefined>
): Promise<
  | { subject: string; html: string; from_name: string; from_email: string; reply_to: string | null }
  | null
> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("key, subject, html_content, from_name, from_email, reply_to")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return null;

  const template = data as EmailTemplate;

  // HTML-escape toutes les valeurs interpolées : user input (prenom, email,
  // full_name) vient en partie de Stripe Checkout ou de formulaires web et
  // peut contenir des chars HTML (<script>, etc.). Pour les URLs dans les
  // attributs href, l'escape ne casse rien (& devient &amp; ce qui est le
  // bon encodage HTML en attribut).
  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => {
      switch (c) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        default: return c;
      }
    });

  const replaceHtml = (s: string) =>
    s.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, name) => {
      const v = variables[name];
      return v === undefined || v === null ? "" : escapeHtml(String(v));
    });

  // Le subject est du text/plain côté mail, pas de HTML possible. On
  // n'escape pas pour ne pas altérer les caractères style & dans un titre.
  const replaceRaw = (s: string) =>
    s.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, name) => {
      const v = variables[name];
      return v === undefined || v === null ? "" : String(v);
    });

  return {
    subject: replaceRaw(template.subject),
    html: replaceHtml(template.html_content),
    from_name: template.from_name,
    from_email: template.from_email,
    reply_to: template.reply_to,
  };
}
