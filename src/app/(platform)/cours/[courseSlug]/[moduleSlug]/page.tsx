import { createServiceClient, getCachedUser } from "@/lib/supabase/server";
import { getFullCourseStructure } from "@/lib/notion/queries";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { Breadcrumb } from "@/components/platform/Breadcrumb";
import { LessonRow } from "@/components/platform/LessonRow";
import { hasActiveEnrollmentForCourse } from "@/lib/platform/enrollments";

interface PageProps {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { courseSlug, moduleSlug } = await params;

  const [user, structure] = await Promise.all([getCachedUser(), getFullCourseStructure(courseSlug)]);
  if (!user) redirect("/connexion");
  if (!structure) notFound();

  const supabase = await createServiceClient();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();
  let isStaff = Boolean(adminEmail && userEmail === adminEmail);
  if (!isStaff) {
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isStaff = prof?.role === "admin";
  }
  if (!isStaff) {
    const allowed = await hasActiveEnrollmentForCourse(supabase, user.id, courseSlug);
    if (!allowed) redirect("/dashboard?notice=no-access");
  }

  // Trouver le module + son index parmi tous les modules pour breadcrumb / numérotation.
  const moduleIdx = structure.modules.findIndex(({ module }) => module.slug === moduleSlug);
  if (moduleIdx < 0) notFound();
  const { module, lessons } = structure.modules[moduleIdx];

  const { data: progressData } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("course_id", structure.course.id);

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id as string));
  const completedInModule = lessons.filter((l) => completedIds.has(l.id)).length;
  const totalLessons = lessons.length;
  const moduleDoneCompletely = totalLessons > 0 && completedInModule === totalLessons;

  // Prochaine leçon dans CE module a faire (première non complétée)
  const nextLessonIdx = lessons.findIndex((l) => !completedIds.has(l.id));
  const nextLessonInModule = nextLessonIdx >= 0 ? lessons[nextLessonIdx] : null;

  // Modules adjacents pour navigation bas de page
  const prevModule = moduleIdx > 0 ? structure.modules[moduleIdx - 1] : null;
  const nextModule = moduleIdx < structure.modules.length - 1 ? structure.modules[moduleIdx + 1] : null;

  const durationMinutes = lessons.reduce((s, l) => s + (l.videoDuration || 0), 0);

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: structure.course.name, href: `/cours/${courseSlug}` },
          { label: module.name },
        ]}
      />

      <header>
        <p className="text-xs uppercase tracking-widest text-es-green font-semibold">Module {moduleIdx + 1}</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-1">{module.name}</h1>
        {module.description && <p className="text-gray-500 mt-2 max-w-2xl">{module.description}</p>}
        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ProgressBar
            value={completedInModule}
            max={totalLessons}
            label={`${completedInModule} / ${totalLessons} leçons`}
            className="flex-1 max-w-md"
          />
          {durationMinutes > 0 && (
            <span className="text-xs uppercase tracking-widest text-gray-400">{formatDuration(durationMinutes)} de video</span>
          )}
        </div>
      </header>

      {nextLessonInModule && !moduleDoneCompletely && (
        <Card className="bg-gradient-to-br from-es-green/5 to-es-green/10 border-es-green/20">
          <p className="text-xs uppercase tracking-widest text-es-green font-semibold">
            {completedInModule > 0 ? "Continuer dans ce module" : "Première leçon"}
          </p>
          <h2 className="font-serif text-xl font-bold text-gray-900 mt-1">{nextLessonInModule.name}</h2>
          <Link
            href={`/cours/${courseSlug}/${moduleSlug}/${nextLessonInModule.slug}`}
            className="inline-flex items-center gap-2 mt-4 bg-es-green text-white font-semibold px-5 py-3 rounded-xl hover:bg-es-green-light transition-colors"
          >
            {completedInModule > 0 ? "Reprendre" : "Commencer"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>
      )}

      {moduleDoneCompletely && (
        <Card className="bg-gradient-to-br from-es-green/10 to-es-green/20 border-es-green/30">
          <p className="text-xs uppercase tracking-widest text-es-green font-semibold">Module terminé</p>
          <p className="text-sm text-gray-700 mt-1">Beau travail. Passe au module suivant ou revois une leçon si besoin.</p>
        </Card>
      )}

      <section>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">Les leçons</h2>
        <div className="space-y-1">
          {lessons.map((lesson, idx) => (
            <LessonRow
              key={lesson.id}
              index={idx + 1}
              href={`/cours/${courseSlug}/${moduleSlug}/${lesson.slug}`}
              name={lesson.name}
              durationMinutes={lesson.videoDuration}
              isCompleted={completedIds.has(lesson.id)}
            />
          ))}
          {lessons.length === 0 && (
            <p className="text-sm text-gray-500 italic">Aucune leçon publiée dans ce module pour l&apos;instant.</p>
          )}
        </div>
      </section>

      <nav aria-label="Navigation entre modules" className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-gray-100 pt-6">
        {prevModule ? (
          <Link
            href={`/cours/${courseSlug}/${prevModule.module.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-es-green transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Module précédent : {prevModule.module.name}
          </Link>
        ) : <span />}
        {nextModule ? (
          <Link
            href={`/cours/${courseSlug}/${nextModule.module.slug}`}
            className="inline-flex items-center gap-2 text-sm text-es-green font-medium hover:text-es-green-light transition-colors"
          >
            Module suivant : {nextModule.module.name}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
