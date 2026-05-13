import { createServiceClient, getCachedUser } from "@/lib/supabase/server";
import {
  getLessonBySlug,
  getLessonBlocks,
  getResourcesByLesson,
  getFullCourseStructure,
} from "@/lib/notion/queries";
import { generateSignedVideoUrl } from "@/lib/bunny/signed-url";
import { buildLessonCode, getQuizByLessonCode } from "@/lib/supabase/quiz";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonContent } from "@/components/course/LessonContent";
import { CompletionButton } from "@/components/course/CompletionButton";
import { Sidebar } from "@/components/course/Sidebar";
import { QuizForm } from "@/components/course/QuizForm";
import { Breadcrumb } from "@/components/platform/Breadcrumb";
import { hasActiveEnrollmentForCourse } from "@/lib/platform/enrollments";

interface PageProps {
  params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;

  const [user, lesson, structure] = await Promise.all([
    getCachedUser(),
    getLessonBySlug(lessonSlug),
    getFullCourseStructure(courseSlug),
  ]);
  if (!user) redirect("/connexion");
  if (!lesson) notFound();
  if (!structure) notFound();

  // Vérification enrollment cote code en plus de RLS. On bypass pour les
  // admins/staff (consultation contenu sans avoir acheté).
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

  // Index du module pour breadcrumb + numérotation cohérente
  const moduleIdx = structure.modules.findIndex(({ module }) => module.slug === moduleSlug);
  const moduleName = moduleIdx >= 0 ? structure.modules[moduleIdx].module.name : "Module";

  // Parallel : blocks + resources + progress
  const [blocks, resources, progressRes] = await Promise.all([
    getLessonBlocks(lesson.id),
    getResourcesByLesson(lesson.id),
    supabase.from("progress").select("lesson_id").eq("user_id", user.id).eq("course_id", structure.course.id),
  ]);
  const progressData = progressRes.data;

  // URL Bunny signee (token 30 min sera ajoute par le morceau 9 ; pour l'instant
  // on garde generateSignedVideoUrl qui retourne l'URL CDN actuelle).
  let signedVideoUrl: string | undefined;
  if (lesson.videoId) signedVideoUrl = generateSignedVideoUrl({ videoId: lesson.videoId });

  const completedIds = new Set((progressData || []).map((p) => p.lesson_id as string));
  const isCompleted = completedIds.has(lesson.id);

  // Navigation prev/next sur la timeline complete du cours
  type FlatLesson = { moduleSlug: string; slug: string; name: string; id: string };
  const allLessons: FlatLesson[] = [];
  for (const { module, lessons } of structure.modules) {
    for (const l of lessons) {
      allLessons.push({ moduleSlug: module.slug, slug: l.slug, name: l.name, id: l.id });
    }
  }
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson: FlatLesson | null = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson: FlatLesson | null =
    currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Quiz : lookup par lesson_code (M1-LA, M2-LB...) deduit de l'ordre Notion.
  let quiz: Awaited<ReturnType<typeof getQuizByLessonCode>> = null;
  for (const { module, lessons } of structure.modules) {
    const li = lessons.findIndex((l) => l.id === lesson.id);
    if (li >= 0) {
      const code = buildLessonCode(module.order, li + 1);
      quiz = await getQuizByLessonCode(code);
      break;
    }
  }

  return (
    <div className="flex -mx-6 -my-8">
      {/* Sidebar */}
      <Sidebar
        structure={structure}
        currentLessonId={lesson.id}
        completedLessonIds={completedIds}
        courseSlug={courseSlug}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: structure.course.name, href: `/cours/${courseSlug}` },
              { label: moduleName, href: `/cours/${courseSlug}/${moduleSlug}` },
              { label: lesson.name },
            ]}
          />

          {lesson.videoId && (
            <VideoPlayer videoId={lesson.videoId} signedUrl={signedVideoUrl} className="mb-8" />
          )}

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-6">{lesson.name}</h1>

          <LessonContent blocks={blocks} />

          {resources.length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-4">Ressources de cette leçon</h3>
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{resource.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{resource.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {quiz && quiz.questions.length > 0 && (
            <div className="mt-10">
              <QuizForm lessonCode={quiz.lessonCode} questions={quiz.questions} passScore={70} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <CompletionButton lessonId={lesson.id} courseId={structure.course.id} initialCompleted={isCompleted} />
          </div>

          <div className="mt-6 flex items-center justify-between">
            {prevLesson ? (
              <Link
                href={`/cours/${courseSlug}/${prevLesson.moduleSlug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-es-green transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {prevLesson.name}
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`/cours/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.slug}`}
                className="flex items-center gap-2 text-sm text-es-green font-medium hover:text-es-green-light transition-colors"
              >
                {nextLesson.name}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
