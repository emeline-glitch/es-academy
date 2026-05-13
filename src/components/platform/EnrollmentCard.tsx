import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface EnrollmentCardProps {
  title: string;
  description: string;
  modulesCount: number;
  totalLessons: number;
  completed: number;
  href: string;
  /** Slug pour deep link "Reprendre". Si null, on tombe sur href racine du cours. */
  resumeHref?: string | null;
}

export function EnrollmentCard({
  title,
  description,
  modulesCount,
  totalLessons,
  completed,
  href,
  resumeHref,
}: EnrollmentCardProps) {
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
  const isDone = percent >= 100;
  const hasStarted = completed > 0;
  const cta = isDone ? "Revoir le cours" : hasStarted ? "Reprendre ou je m'etais arrete" : "Commencer la formation";

  return (
    <Card hover className="flex flex-col h-full">
      <div className="aspect-video bg-gradient-to-br from-es-green/10 to-es-green/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        <span className="font-serif text-3xl font-bold text-es-green">ES</span>
        {isDone && (
          <span className="absolute top-3 right-3 bg-es-green text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Terminé
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 flex-1">{description}</p>
      <p className="text-xs text-gray-400 mb-3">
        {modulesCount} modules <span className="text-gray-300">·</span> {totalLessons} leçons
      </p>
      <ProgressBar
        value={completed}
        max={totalLessons}
        label={`${completed} / ${totalLessons} leçons`}
        className="mb-4"
      />
      <Link
        href={hasStarted && resumeHref ? resumeHref : href}
        className="inline-flex items-center justify-center w-full bg-es-green text-white font-semibold py-3 rounded-xl hover:bg-es-green-light transition-colors"
      >
        {cta}
      </Link>
    </Card>
  );
}
