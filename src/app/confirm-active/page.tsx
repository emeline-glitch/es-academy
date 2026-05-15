import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

/**
 * Page /confirm-active : utilisee dans la sequence SEQ_REACT (reactivation
 * inactifs 90j) mails 1 et 4. Quand un contact clique "Oui je reste dans
 * la communaute", on retire son tag behavior:inactive-90 + ajoute un tag
 * behavior:reactivated pour tracer la confirmation.
 *
 * Si pas d'email -> message generique. Si email connu -> retire le tag.
 * Best-effort : si la DB est down, on affiche quand meme le merci.
 */
export default async function ConfirmActivePage({ searchParams }: PageProps) {
  const { email } = await searchParams;

  let recognized = false;

  if (email) {
    try {
      const supabase = await createServiceClient();
      const emailLc = email.toLowerCase();
      const { data: contact } = await supabase
        .from("contacts")
        .select("id, tags")
        .eq("email", emailLc)
        .maybeSingle();

      if (contact?.tags && Array.isArray(contact.tags)) {
        recognized = true;
        // Retire 2 tags d'inactivite : behavior:inactive-90 (SEQ_REACT) ET
        // rgpd:cohorte-2-pending (SEQ_BRV cohorte 2 Brevo).
        const tags = (contact.tags as string[]).filter(
          (t) => t !== "behavior:inactive-90" && t !== "rgpd:cohorte-2-pending"
        );
        // Ajoute les tags de reactivation et de consentement RGPD.
        const wasBrvCohorte = (contact.tags as string[]).includes("rgpd:cohorte-2-pending");
        if (!tags.includes("behavior:reactivated")) {
          tags.push("behavior:reactivated");
        }
        if (wasBrvCohorte && !tags.includes("rgpd:consent-explicit")) {
          tags.push("rgpd:consent-explicit");
        }
        await supabase
          .from("contacts")
          .update({
            tags,
            last_activity_at: new Date().toISOString(),
          })
          .eq("email", emailLc);

        // Log consent_log pour la cohorte 2 Brevo (preuve RGPD du
        // re-consentement explicite, obligation CNIL).
        if (wasBrvCohorte) {
          try {
            await supabase.from("consent_log").insert({
              email: emailLc,
              consent_type: "newsletter_marketing",
              action: "accepted",
              basis: "explicit_reoptin_brevo_cohorte_2",
              proof: {
                page: "/confirm-active",
                source: "seq_brv_email_link",
                confirmed_at: new Date().toISOString(),
              },
            });
          } catch {
            // best-effort, ne bloque pas la page
          }
        }
      }
    } catch (err) {
      console.error("[confirm-active]", err);
    }
  }

  // Si pas d'email du tout, on redirige vers la home (probablement une
  // visite directe sans contexte)
  if (!email) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-es-cream flex items-center justify-center px-6 py-12">
      <Card className="max-w-xl w-full text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h1 className="font-serif text-3xl font-bold text-es-green mb-4">
          Merci d&apos;être resté
        </h1>
        {recognized ? (
          <>
            <p className="text-gray-700 mb-6 leading-relaxed">
              C&apos;est noté : tu fais toujours partie de la communauté Emeline Siron. Tu vas continuer à recevoir mes mails, mes coups de cœur, et mes analyses de marché.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              On se retrouve dans ta boîte mail bientôt. À très vite.
            </p>
          </>
        ) : (
          <p className="text-gray-700 mb-6 leading-relaxed">
            Bienvenue. Si tu n&apos;es pas encore inscrite à la newsletter, c&apos;est par ici que ça se passe.
          </p>
        )}
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-es-green text-white rounded-lg font-semibold hover:bg-es-green-light transition-colors"
        >
          Retour au site
        </a>
        <p className="text-xs text-gray-400 mt-6">
          Emeline Siron · emeline-siron.fr
        </p>
      </Card>
    </main>
  );
}
