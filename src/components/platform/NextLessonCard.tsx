import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { RecommendedLesson } from "@/lib/platform/recommendations";

interface NextLessonCardProps {
  next: RecommendedLesson;
  hasStarted: boolean;
}

export function NextLessonCard({ next, hasStarted }: NextLessonCardProps) {
  const href = `/cours/${next.courseSlug}/${next.moduleSlug}/${next.lessonSlug}`;
  const cta = hasStarted ? "Reprendre" : "Commencer maintenant";

  return (
    <Card className="bg-gradient-to-br from-es-green/5 to-es-green/10 border-es-green/20">
      <p className="text-xs uppercase tracking-widest text-es-green font-semibold">
        {hasStarted ? "Reprends ou tu en etais" : "Première leçon"}
      </p>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mt-1">{next.lessonName}</h2>
      <p className="text-sm text-gray-500 mt-1">
        Module : {next.moduleName} <span className="text-gray-300">·</span> Leçon {next.position} / {next.total}
      </p>
      <ProgressBar
        value={Math.max(0, next.position - 1)}
        max={next.total}
        showPercentage={false}
        className="mt-4 max-w-md"
      />
      <Link
        href={href}
        className="inline-flex items-center gap-2 mt-5 bg-es-green text-white font-semibold px-5 py-3 rounded-xl hover:bg-es-green-light transition-colors"
      >
        {cta}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </Card>
  );
}
