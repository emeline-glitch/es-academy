import Link from "next/link";

interface LessonRowProps {
  index: number;
  href: string;
  name: string;
  durationMinutes: number | null;
  isCompleted: boolean;
  isCurrent?: boolean;
}

export function LessonRow({ index, href, name, durationMinutes, isCompleted, isCurrent }: LessonRowProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
        isCurrent
          ? "border-es-green bg-es-green/5"
          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {isCompleted ? (
          <svg className="w-6 h-6 text-es-green" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="text-xs text-gray-400 font-medium">{index}</span>
        )}
      </div>
      <span className="flex-1 text-sm text-gray-800">{name}</span>
      {durationMinutes !== null && durationMinutes > 0 && (
        <span className="text-xs text-gray-400">{durationMinutes} min</span>
      )}
    </Link>
  );
}
