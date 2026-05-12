import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

// Metadata par course_id : total lecons + meta affichee sur la carte.
// 66 lecons = total de "La Methode Emeline SIRON" (14 modules). A garder
// sync avec le contenu Notion. Si on ajoute une formation, on l'ajoute ici.
const COURSE_META: Record<
  string,
  { title: string; modules: number; videoHours: number; tools: number; totalLessons: number; href: string }
> = {
  "methode-emeline-siron": {
    title: "La Méthode Emeline SIRON",
    modules: 14,
    videoHours: 30,
    tools: 60,
    totalLessons: 66,
    href: "/cours/methode-emeline-siron",
  },
};

const DEFAULT_COURSE_ID = "methode-emeline-siron";

export default async function Dashboard() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Élève";

  // Service client : le user pourrait lire ses propres rows via RLS, mais on
  // garde service ici pour eviter un round-trip auth et rester coherent avec
  // le layout (platform) qui utilise deja service pour le gating product.
  const supabase = await createServiceClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, product_name, purchased_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("purchased_at", { ascending: false });

  const userEnrollments = enrollments || [];

  // Aggregation progress par course_id en 1 seule query (vs N par enrollment).
  const courseIds = userEnrollments
    .map((e) => e.course_id)
    .filter((c): c is string => Boolean(c));

  const progressByCourse: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("progress")
      .select("course_id")
      .eq("user_id", user.id)
      .in("course_id", courseIds);

    for (const row of progressRows || []) {
      const cid = row.course_id;
      if (cid) progressByCourse[cid] = (progressByCourse[cid] || 0) + 1;
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">
          Bonjour {displayName} !
        </h1>
        <p className="text-gray-500 mt-1">Bienvenue dans ton espace de formation.</p>
      </div>

      {/* Enrolled courses */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userEnrollments.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">
              Tu n&apos;as pas encore de formation active.
              <br className="hidden sm:inline" />
              Découvre La Méthode Emeline SIRON pour commencer.
            </p>
            <Button href="/academy" variant="primary">
              Voir la formation
            </Button>
          </Card>
        ) : (
          userEnrollments.map((enrollment) => {
            const courseId = enrollment.course_id || DEFAULT_COURSE_ID;
            const meta = COURSE_META[courseId] || COURSE_META[DEFAULT_COURSE_ID];
            const completed = progressByCourse[courseId] || 0;
            const total = meta.totalLessons;
            const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            const cta = percent === 0 ? "Commencer" : percent >= 100 ? "Revoir" : "Continuer";

            return (
              <Card key={enrollment.id} hover className="flex flex-col">
                <div className="aspect-video bg-es-green/10 rounded-lg mb-4 flex items-center justify-center">
                  <span className="font-serif text-2xl font-bold text-es-green">ES</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">
                  {meta.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  {meta.modules} modules · {meta.videoHours}h de vidéo · {meta.tools} outils
                </p>
                <ProgressBar
                  value={percent}
                  label={`Progression · ${completed}/${total} leçons`}
                  className="mb-4"
                />
                <Button href={meta.href} variant="primary" className="w-full">
                  {cta}
                </Button>
              </Card>
            );
          })
        )}

        {/* Empty state for no more courses : seulement si l'utilisateur a deja
            au moins 1 enrollment (sinon le card vide ci-dessus suffit). */}
        {userEnrollments.length > 0 && (
          <Card className="flex flex-col items-center justify-center text-center border-dashed border-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">D&apos;autres formations bientôt</p>
          </Card>
        )}
      </div>

      {/* ES Family CTA : fond mint clair, CTA noir, features en pilules */}
      <div className="mt-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-es-mint-soft via-es-mint-light to-es-mint-pastel">
          <div className="absolute top-0 right-0 w-72 h-72 bg-es-mint/20 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/40 rounded-full translate-y-1/2 blur-3xl" />
          <div className="relative grid lg:grid-cols-5 gap-8 p-6 md:p-10">
            {/* Pitch + CTA */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-es-mint" />
                <span className="text-[11px] font-semibold text-es-mint-deep uppercase tracking-[0.18em]">ES Family</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-es-mint-deep leading-[1.15] mb-4">
                Ta communauté patrimoniale,
                <br />
                <span className="italic font-normal">dans ta poche.</span>
              </h2>
              <p className="text-es-mint-deep/75 text-[15px] leading-relaxed mb-2">
                Lives, simulateurs, partenaires et discussions entre membres.
              </p>
              <p className="text-es-mint-deep font-medium text-[15px] mb-6">
                Pour le prix d&apos;un forfait téléphonique.
              </p>
              <a
                href="/family"
                className="inline-flex items-center justify-center font-medium rounded-full px-6 py-3 bg-gray-900 text-white hover:bg-black transition-all text-sm shadow-sm w-fit"
              >
                Rejoindre ES Family : 19€/mois
                <svg className="w-3.5 h-3.5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-es-mint-deep/60 text-xs mt-3">
                Tarif fondateur à vie · Sans engagement · Résiliable en 1 clic
              </p>
            </div>

            {/* Features en pilules blanches */}
            <div className="lg:col-span-2 flex flex-col gap-2.5 justify-center">
              {[
                {
                  label: "App mobile 7j/7",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="7" y="3" width="10" height="18" rx="2" strokeLinecap="round" />
                      <line x1="11" y1="18" x2="13" y2="18" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  label: "Lives + replays",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="2" y="6" width="14" height="12" rx="2" strokeLinejoin="round" />
                      <path d="M22 8l-6 4 6 4V8z" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "5 simulateurs",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <line x1="6" y1="20" x2="6" y2="10" strokeLinecap="round" />
                      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
                      <line x1="18" y1="20" x2="18" y2="14" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  label: "Codes partenaires",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" strokeLinejoin="round" />
                      <path d="M3 8l9 6 9-6M3 8a2 2 0 012-2h14a2 2 0 012 2" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Groupes thématiques",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  label: "Annuaire networking",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinejoin="round" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white rounded-full pl-3 pr-5 py-2.5 shadow-sm"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-es-mint-soft text-es-mint-dark shrink-0">
                    {f.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-900 leading-snug">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incitation avis Google/Trustpilot */}
      <div className="mt-8">
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Tu aimes la formation ? Dis-le ! 💬</h3>
              <p className="text-sm text-gray-500">
                Ton avis aide d&apos;autres investisseurs à nous découvrir. 2 minutes suffisent et ça compte énormément.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button href="https://www.google.com/search?q=emeline+siron+avis" variant="secondary" size="sm" target="_blank" rel="noopener">
                ⭐ Avis Google
              </Button>
              <Button href="https://fr.trustpilot.com/review/emelinesiron.com" variant="secondary" size="sm" target="_blank" rel="noopener">
                ⭐ Trustpilot
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
