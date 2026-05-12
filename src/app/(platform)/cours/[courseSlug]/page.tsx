import { createServiceClient, getCachedUser } from "@/lib/supabase/server";
import { getFullCourseStructure } from "@/lib/notion/queries";
import { redirect, notFound } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { Breadcrumb } from "@/components/platform/Breadcrumb";
import { ModuleRow } from "@/components/platform/ModuleRow";
import { hasActiveEnrollmentForCourse } from "@/lib/platform/enrollments";
import { findNextLesson, computeModuleProgress } from "@/lib/platform/recommendations";
import Link from "next/link";

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

export default async function CoursePage({ params }: PageProps) {
  const { courseSlug } = await params;

  const [user, structure] = await Promise.all([getCachedUser(), getFullCourseStructure(courseSlug)]);
  if (!user) redirect("/connexion");
  if (!structure) notFound();

  // Double-check enrollment cote code (le layout (platform) gate sur "academy%"
  // de maniere coarse, mais ici on veut s'assurer que l'user a bien CE course).
  // On accepte aussi les admins/staff via role.
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
    if (!allowed) {
      redirect("/dashboard?notice=no-access");
    }
  }

  const { data: progressData } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("course_id", structure.course.id);

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id as string));
  const totalLessons = structure.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const nextLesson = findNextLesson(courseSlug, structure, completedIds);
  const moduleProgress = computeModuleProgress(structure, completedIds);

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: structure.course.name }]} />

      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">{structure.course.name}</h1>
        {structure.course.description && (
          <p className="text-gray-500 mt-2 max-w-2xl">{structure.course.description}</p>
        )}
        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ProgressBar
            value={completedCount}
            max={totalLessons}
            label={`${completedCount} / ${totalLessons} leçons`}
            className="flex-1 max-w-md"
          />
          <span className="text-xs uppercase tracking-widest text-gray-400">
            {percent === 0 ? "Pas commencee" : percent === 100 ? "Terminée" : "En cours"}
          </span>
        </div>
      </header>

      {nextLesson && percent < 100 && (
        <Card className="bg-gradient-to-br from-es-green/5 to-es-green/10 border-es-green/20">
          <p className="text-xs uppercase tracking-widest text-es-green font-semibold">
            {completedCount > 0 ? "Continuer ou tu en etais" : "Première leçon"}
          </p>
          <h2 className="font-serif text-xl font-bold text-gray-900 mt-1">{nextLesson.lessonName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Module : {nextLesson.moduleName} <span className="text-gray-300">·</span> Leçon {nextLesson.position} / {nextLesson.total}
          </p>
          <Link
            href={`/cours/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`}
            className="inline-flex items-center gap-2 mt-4 bg-es-green text-white font-semibold px-5 py-3 rounded-xl hover:bg-es-green-light transition-colors"
          >
            {completedCount > 0 ? "Reprendre" : "Commencer maintenant"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>
      )}

      <section>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Les modules</h2>
        <div className="space-y-3">
          {structure.modules.map(({ module, lessons }, idx) => {
            const progress = moduleProgress[idx];
            return (
              <ModuleRow
                key={module.id}
                index={idx + 1}
                name={module.name}
                description={module.description}
                href={`/cours/${courseSlug}/${module.slug}`}
                totalLessons={lessons.length}
                completed={progress.completed}
                durationMinutes={progress.durationMinutes}
                status={progress.status}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
