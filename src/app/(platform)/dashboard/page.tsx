import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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

      {/* ES Family CTA : bannière complète cliquable */}
      <div className="mt-12">
        <Link
          href="/family"
          aria-label="Rejoindre ES Family : 19€/mois"
          className="block overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
        >
          <Image
            src="/images/family-banner-formation.png"
            alt="ES Family : ta communauté patrimoniale, dans ta poche. Rejoindre pour 19€/mois."
            width={2400}
            height={680}
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="w-full h-auto"
          />
        </Link>
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
