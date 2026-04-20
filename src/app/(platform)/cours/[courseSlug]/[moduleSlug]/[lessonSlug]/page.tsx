import { createClient, getCachedUser } from "@/lib/supabase/server";
import { getLessonBySlug, getLessonBlocks, getResourcesByLesson, getFullCourseStructure } from "@/lib/notion/queries";
import { generateSignedVideoUrl } from "@/lib/bunny/signed-url";
import { redirect, notFound } from "next/navigation";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonContent } from "@/components/course/LessonContent";
import { CompletionButton } from "@/components/course/CompletionButton";
import { Sidebar } from "@/components/course/Sidebar";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  // Parallélise : user + lesson + structure (tous indépendants)
  const [user, lesson, structure] = await Promise.all([
    getCachedUser(),
    getLessonBySlug(lessonSlug),
    getFullCourseStructure(courseSlug),
  ]);
  if (!user) redirect("/connexion");
  if (!lesson) notFound();
  if (!structure) notFound();

  // Parallélise aussi : blocks + resources + progress (tous dépendent de lesson/structure mais indépendants entre eux)
  const supabase = await createClient();
  const [blocks, resources, progressRes] = await Promise.all([
    getLessonBlocks(lesson.id),
    getResourcesByLesson(lesson.id),
    supabase
      .from("progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", structure.course.id),
  ]);
  const progressData = progressRes.data;

  // Generate signed video URL
  let signedVideoUrl: string | undefined;
  if (lesson.videoId) {
    signedVideoUrl = generateSignedVideoUrl({ videoId: lesson.videoId });
  }

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id));
  const isCompleted = completedIds.has(lesson.id);

  // Find previous and next lessons
  let prevLesson: { moduleSlug: string; slug: string; name: string } | null = null;
  let nextLesson: { moduleSlug: string; slug: string; name: string } | null = null;
  const allLessons: Array<{ moduleSlug: string; slug: string; name: string; id: string }> = [];

  for (const { module, lessons } of structure.modules) {
    for (const l of lessons) {
      allLessons.push({ moduleSlug: module.slug, slug: l.slug, name: l.name, id: l.id });
    }
  }

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  if (currentIndex > 0) prevLesson = allLessons[currentIndex - 1];
  if (currentIndex < allLessons.length - 1) nextLesson = allLessons[currentIndex + 1];

  return (
    <div className="flex -mx-6 -my-8">
      {/* Sidebar */}
      <Sidebar
        structure={structure}
        currentLessonId={lesson.id}
        completedLessonIds={completedIds}
        courseSlug={courseSlug}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Video */}
          {lesson.videoId && (
            <VideoPlayer
              videoId={lesson.videoId}
              signedUrl={signedVideoUrl}
              className="mb-8"
            />
          )}

          {/* Lesson title */}
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">
            {lesson.name}
          </h1>

          {/* Content */}
          <LessonContent blocks={blocks} />

          {/* Resources */}
          {resources.length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-4">Ressources</h3>
              <div className="space-y-2">
                {resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.fileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-es-green transition-colors"
                  >
                    <svg className="w-5 h-5 text-es-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{resource.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{resource.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completion + navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <CompletionButton
              lessonId={lesson.id}
              courseId={structure.course.id}
              initialCompleted={isCompleted}
            />
          </div>

          {/* Previous / Next */}
          <div className="mt-6 flex items-center justify-between">
            {prevLesson ? (
              <a
                href={`/cours/${courseSlug}/${prevLesson.moduleSlug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-es-green transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {prevLesson.name}
              </a>
            ) : <div />}
            {nextLesson ? (
              <a
                href={`/cours/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.slug}`}
                className="flex items-center gap-2 text-sm text-es-green font-medium hover:text-es-green-light transition-colors"
              >
                {nextLesson.name}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
