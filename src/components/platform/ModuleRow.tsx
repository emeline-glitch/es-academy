import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ModuleStatus } from "@/lib/platform/recommendations";

interface ModuleRowProps {
  index: number;
  name: string;
  description: string;
  href: string;
  totalLessons: number;
  completed: number;
  durationMinutes: number;
  status: ModuleStatus;
}

const statusLabels: Record<ModuleStatus, string> = {
  completed: "Terminé",
  in_progress: "En cours",
  available: "Disponible",
  locked: "Verrouillé",
};

const statusClasses: Record<ModuleStatus, string> = {
  completed: "bg-es-green/10 text-es-green",
  in_progress: "bg-amber-50 text-amber-700",
  available: "bg-gray-100 text-gray-600",
  locked: "bg-gray-100 text-gray-400",
};

export function ModuleRow({
  index,
  name,
  description,
  href,
  totalLessons,
  completed,
  durationMinutes,
  status,
}: ModuleRowProps) {
  const isLocked = status === "locked";
  const cardClass = `block bg-white rounded-xl border border-gray-200 p-5 transition-all ${
    isLocked ? "opacity-60 cursor-not-allowed" : "hover:border-es-green/40 hover:shadow-sm"
  }`;

  const body = (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 shrink-0 rounded-full bg-es-green/10 text-es-green flex items-center justify-center font-serif font-bold">
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-serif text-base font-bold text-gray-900">{name}</h3>
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusClasses[status]}`}
          >
            {statusLabels[status]}
          </span>
        </div>
        {description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span>{totalLessons} leçons</span>
          {durationMinutes > 0 && (
            <>
              <span className="text-gray-200">·</span>
              <span>{formatDuration(durationMinutes)}</span>
            </>
          )}
        </div>
        <ProgressBar value={completed} max={totalLessons} size="sm" showPercentage={false} className="max-w-md" />
      </div>
    </div>
  );

  if (isLocked) {
    return <div className={cardClass}>{body}</div>;
  }
  return (
    <Link href={href} className={cardClass}>
      {body}
    </Link>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
