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
  const replacer = (s: string) =>
    s.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, name) => {
      const v = variables[name];
      return v === undefined || v === null ? "" : String(v);
    });

  return {
    subject: replacer(template.subject),
    html: replacer(template.html_content),
    from_name: template.from_name,
    from_email: template.from_email,
    reply_to: template.reply_to,
  };
}
