import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default async function CoachingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Fetch coaching notes for this user
  const { data: notes } = await supabase
    .from("coaching_notes")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Coaching</h1>
        <p className="text-gray-500 mt-1">Tes notes de coaching personnalisées par Emeline.</p>
      </div>

      {/* Sessions collectives */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📅</span>
          <div>
            <h2 className="font-medium text-gray-900">Sessions collectives mensuelles</h2>
            <p className="text-sm text-gray-500">Chaque mois, un live avec Emeline pour répondre à tes questions.</p>
          </div>
        </div>
        <div className="bg-es-green/5 rounded-lg p-4 text-sm text-es-text-muted">
          La prochaine session sera annoncée par email. Les replays sont disponibles dans la formation.
        </div>
      </Card>

      {/* Notes de coaching */}
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Notes de coaching</h2>

      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-es-green/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-es-green">ES</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Emeline Siron</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(note.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Pas encore de notes</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Tes notes de coaching apparaîtront ici une fois qu&apos;Emeline aura laissé un retour personnalisé.
          </p>
        </Card>
      )}

      {/* Coaching sur mesure CTA */}
      <div className="mt-8 bg-es-green rounded-2xl p-8 text-white text-center">
        <h3 className="font-serif text-xl font-bold mb-2">Besoin d&apos;un accompagnement personnalisé ?</h3>
        <p className="text-white/70 text-sm mb-6">Le coaching sur mesure est adapté à ton profil et tes objectifs d&apos;investissement.</p>
        <a
          href="mailto:contact@emelinesiron.com?subject=Demande coaching sur mesure"
          className="inline-flex items-center justify-center bg-es-gold text-white font-semibold px-6 py-3 rounded-xl hover:bg-es-gold-dark transition-colors"
        >
          Demander un devis →
        </a>
      </div>
    </div>
  );
}
