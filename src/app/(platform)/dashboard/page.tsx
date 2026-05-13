import { Suspense } from "react";
import { getCachedUser, createServiceClient } from "@/lib/supabase/server";
import { getFullCourseStructure } from "@/lib/notion/queries";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WeeklyOverview } from "@/components/platform/WeeklyOverview";
import { NextLessonCard } from "@/components/platform/NextLessonCard";
import { EnrollmentCard } from "@/components/platform/EnrollmentCard";
import { RecentResources } from "@/components/platform/RecentResources";
import { getActiveEnrollments, getCompletedCountsByCourse } from "@/lib/platform/enrollments";
import { getLearnerStats } from "@/lib/platform/stats";
import { findNextLesson } from "@/lib/platform/recommendations";
import { getRelevantResources } from "@/lib/platform/resources";

// Metadata par course_id : total leçons + meta affichée sur la carte.
// 66 leçons = total de "La Méthode Emeline SIRON" (14 modules). A garder
// sync avec le contenu Notion ; si Notion bouge et que ces chiffres derivent,
// le dashboard reste OK car on recalcule completed/total dynamiquement
// depuis la structure Notion + progress.
const COURSE_META: Record<
  string,
  { title: string; description: string; modules: number; totalLessons: number; href: string; slug: string }
> = {
  "methode-emeline-siron": {
    title: "La Méthode Emeline SIRON",
    description: "14 modules, 66 leçons et 91 outils pour batir un patrimoine immobilier qui paie ton train de vie.",
    modules: 14,
    totalLessons: 66,
    href: "/cours/methode-emeline-siron",
    slug: "methode-emeline-siron",
  },
};

const DEFAULT_COURSE_SLUG = "methode-emeline-siron";

export default async function Dashboard() {
  const user = await getCachedUser();
  if (!user) redirect("/connexion");

  const displayName = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "Élève";
  const firstName = displayName.split(/\s+/)[0];

  const supabase = await createServiceClient();
  const enrollments = await getActiveEnrollments(supabase, user.id);

  // Pas d'enrollment : empty state explicite et oriente vers l'achat.
  if (enrollments.length === 0) {
    return <EmptyDashboard displayName={firstName} />;
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-es-green font-semibold">Espace eleve</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-1">
          Salut {firstName} !
        </h1>
        <p className="text-gray-500 mt-1">Reprends ta formation la ou tu en etais. Tu es au bon endroit.</p>
      </header>

      <Suspense fallback={<DashboardBodySkeleton />}>
        <DashboardBody userId={user.id} enrollments={enrollments} />
      </Suspense>

      <FamilyBanner />
      <ReviewCta />
    </div>
  );
}

async function DashboardBody({
  userId,
  enrollments,
}: {
  userId: string;
  enrollments: Awaited<ReturnType<typeof getActiveEnrollments>>;
}) {
  const supabase = await createServiceClient();

  // On parallelise tous les fetches : stats user, profil (coaching credits),
  // structure Notion du cours principal, completion counts par cours.
  const primaryCourseSlug = enrollments[0]?.course_id || DEFAULT_COURSE_SLUG;
  const courseIds = enrollments.map((e) => e.course_id).filter((c): c is string => Boolean(c));

  const [stats, profileRes, structure, completedCounts, lessonProgressRes] = await Promise.all([
    getLearnerStats(supabase, userId),
    supabase.from("profiles").select("coaching_credits_total, coaching_credits_used").eq("id", userId).maybeSingle(),
    getFullCourseStructure(primaryCourseSlug),
    getCompletedCountsByCourse(supabase, userId, courseIds),
    supabase
      .from("progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("course_id", primaryCourseSlug),
  ]);

  const coachingTotal = (profileRes.data?.coaching_credits_total as number | null) ?? 0;
  const coachingUsed = (profileRes.data?.coaching_credits_used as number | null) ?? 0;
  const coachingRemaining = Math.max(coachingTotal - coachingUsed, 0);

  const completedLessonIds = new Set((lessonProgressRes.data || []).map((r) => r.lesson_id as string));
  const nextLesson = structure ? findNextLesson(primaryCourseSlug, structure, completedLessonIds) : null;
  const hasStarted = stats.totalCompleted > 0;
  const isDone = structure
    ? completedLessonIds.size >= structure.modules.reduce((sum, m) => sum + m.lessons.length, 0) &&
      structure.modules.length > 0
    : false;

  const relevantResources = getRelevantResources(structure, completedLessonIds, 3);

  return (
    <>
      {/* Vue d'ensemble hebdomadaire avec mini-graphe 7 jours */}
      <section aria-label="Vue d'ensemble de la semaine">
        <WeeklyOverview stats={stats} coachingRemaining={coachingRemaining} coachingTotal={coachingTotal} />
      </section>

      {/* Continuer ou j'en etais */}
      {nextLesson && !isDone && (
        <section>
          <NextLessonCard next={nextLesson} hasStarted={hasStarted} />
        </section>
      )}

      {/* Etat termine */}
      {isDone && (
        <Card className="bg-gradient-to-br from-es-gold/10 to-es-gold/20 border-es-gold/30">
          <p className="text-xs uppercase tracking-widest text-es-gold-dark font-semibold">Félicitations</p>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mt-1">Tu as terminé la formation</h2>
          <p className="text-sm text-gray-700 mt-2">
            Passe a l&apos;examen final pour valider ta methode complete.
          </p>
          <Link
            href="/evaluation"
            className="inline-flex items-center gap-2 mt-4 bg-es-gold-dark text-white font-semibold px-5 py-3 rounded-xl hover:bg-es-gold transition-colors"
          >
            Faire l&apos;examen final
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>
      )}

      {/* Mes formations */}
      <section>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4">Mes formations</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const slug = enrollment.course_id || DEFAULT_COURSE_SLUG;
            const meta = COURSE_META[slug] || COURSE_META[DEFAULT_COURSE_SLUG];
            const completed = completedCounts[slug] || 0;
            const resumeHref =
              nextLesson && nextLesson.courseSlug === slug
                ? `/cours/${nextLesson.courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`
                : null;
            return (
              <EnrollmentCard
                key={enrollment.id}
                title={meta.title}
                description={meta.description}
                modulesCount={meta.modules}
                totalLessons={meta.totalLessons}
                completed={completed}
                href={meta.href}
                resumeHref={resumeHref}
              />
            );
          })}
        </div>
      </section>

      {/* Coaching + ressources */}
      <section className="grid md:grid-cols-2 gap-6">
        <CoachingTeaser remaining={coachingRemaining} total={coachingTotal} />
        <RecentResources resources={relevantResources} />
      </section>
    </>
  );
}

function CoachingTeaser({ remaining, total }: { remaining: number; total: number }) {
  const hasIncluded = remaining > 0;
  return (
    <Card className="flex flex-col">
      <h3 className="font-serif text-lg font-bold text-gray-900">Coaching avec Emeline</h3>
      {hasIncluded ? (
        <>
          <p className="text-sm text-gray-600 mt-2 flex-1">
            Tu as {remaining} session{remaining > 1 ? "s" : ""} de coaching inclus dans ton offre
            {total > 0 && ` (sur ${total} au total)`}. Réserve ton créneau quand tu veux.
          </p>
          <Link
            href="/coaching"
            className="inline-flex items-center justify-center mt-5 bg-es-green text-white font-semibold px-5 py-3 rounded-xl hover:bg-es-green-light transition-colors"
          >
            Réserver mon créneau
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mt-2 flex-1">
            Pas de coaching inclus dans ton offre actuelle. Tu peux quand meme réserver une session a l&apos;unite (150 EUR / 1h).
          </p>
          <Link
            href="/coaching"
            className="inline-flex items-center justify-center mt-5 bg-white border-2 border-es-green text-es-green font-semibold px-5 py-3 rounded-xl hover:bg-es-green hover:text-white transition-colors"
          >
            Voir les options de coaching
          </Link>
        </>
      )}
    </Card>
  );
}

function FamilyBanner() {
  return (
    <Link
      href="/family"
      aria-label="Rejoindre ES Family : 19 EUR par mois"
      className="block overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
    >
      <Image
        src="/images/family-banner-formation.png"
        alt="ES Family : ta communauté patrimoniale, dans ta poche. Rejoindre pour 19 EUR par mois."
        width={2400}
        height={680}
        sizes="(max-width: 1400px) 100vw, 1400px"
        className="w-full h-auto"
      />
    </Link>
  );
}

function ReviewCta() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#00B67A]/20 bg-gradient-to-br from-es-cream via-white to-white p-6 sm:p-8 shadow-sm">
      {/* Décor : cercle vert Trustpilot en fond */}
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00B67A]/[0.06]" />
      <div aria-hidden="true" className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#00B67A]/[0.04]" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        {/* Bloc étoile Trustpilot */}
        <div className="flex shrink-0 items-center gap-4 md:flex-col md:gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00B67A] shadow-lg shadow-[#00B67A]/20">
            <svg className="h-9 w-9 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="flex gap-0.5 md:hidden">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="flex h-4 w-4 items-center justify-center bg-[#00B67A]">
                <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            ))}
          </div>
        </div>

        {/* Bloc texte */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00B67A]">Avis Trustpilot</span>
            <div className="hidden gap-0.5 md:flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="flex h-4 w-4 items-center justify-center bg-[#00B67A]">
                  <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
              ))}
            </div>
          </div>
          <h3 className="font-serif text-xl font-bold text-gray-900 sm:text-2xl">
            Tu progresses ? Partage ton expérience.
          </h3>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            30 secondes de ton temps. C&apos;est ce qui aide d&apos;autres investisseurs comme toi à oser se lancer.
          </p>
        </div>

        {/* Bloc CTA (Google sera rajouté quand la fiche Business sera validée) */}
        <div className="flex shrink-0">
          <a
            href="https://fr.trustpilot.com/evaluate/emeline-siron.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00B67A] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#00A06D] hover:shadow-lg"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Laisser mon avis
          </a>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard({ displayName }: { displayName: string }) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <h1 className="font-serif text-3xl font-bold text-gray-900">Bienvenue {displayName} !</h1>
      <p className="text-gray-600 mt-3">
        Tu n&apos;as pas encore acces a une formation. Si tu viens d&apos;achetér Academy,
        vérifie tes emails (et tes spams) ou contacte <a className="text-es-green hover:underline" href="mailto:support@emeline-siron.fr">support@emeline-siron.fr</a>.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button href="/academy" variant="primary">Decouvrir Academy</Button>
        <Button href="/family" variant="secondary">Rejoindre ES Family</Button>
      </div>
    </div>
  );
}

function DashboardBodySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-gray-100 rounded-2xl" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-gray-100 rounded-xl" />
        <div className="h-80 bg-gray-100 rounded-xl hidden md:block" />
        <div className="h-80 bg-gray-100 rounded-xl hidden lg:block" />
      </div>
    </div>
  );
}

