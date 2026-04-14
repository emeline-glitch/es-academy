import { createClient } from "@/lib/supabase/server";
import { getFullCourseStructure } from "@/lib/notion/queries";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const structure = await getFullCourseStructure(courseSlug);
  if (!structure) notFound();

  // Get user progress
  const { data: progressData } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("course_id", structure.course.id);

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id));
  const totalLessons = structure.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedIds.size;

  // Find first incomplete lesson for "Continue" button
  let nextLesson: { moduleSlug: string; lessonSlug: string } | null = null;
  for (const { module, lessons } of structure.modules) {
    for (const lesson of lessons) {
      if (!completedIds.has(lesson.id)) {
        nextLesson = { moduleSlug: module.slug, lessonSlug: lesson.slug };
        break;
      }
    }
    if (nextLesson) break;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
          {structure.course.name}
        </h1>
        <p className="text-gray-500">{structure.course.description}</p>
        <ProgressBar
          value={completedCount}
          max={totalLessons}
          label={`${completedCount} / ${totalLessons} lecons terminees`}
          className="mt-4 max-w-md"
        />
        {nextLesson && (
          <Button
            href={`/cours/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`}
            variant="primary"
            className="mt-4"
          >
            {completedCount > 0 ? "Continuer" : "Commencer"}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {structure.modules.map(({ module, lessons }) => {
          const moduleCompleted = lessons.filter((l) => completedIds.has(l.id)).length;
          return (
            <div key={module.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{module.description}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {moduleCompleted}/{lessons.length}
                </span>
              </div>
              <div className="border-t border-gray-100">
                {lessons.map((lesson) => (
                  <a
                    key={lesson.id}
                    href={`/cours/${courseSlug}/${module.slug}/${lesson.slug}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    {completedIds.has(lesson.id) ? (
                      <svg className="w-5 h-5 text-es-green shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 flex-1">{lesson.name}</span>
                    {lesson.videoDuration && (
                      <span className="text-xs text-gray-400">{lesson.videoDuration} min</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
