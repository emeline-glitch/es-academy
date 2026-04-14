"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseStructure } from "@/lib/notion/types";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SidebarProps {
  structure: CourseStructure;
  currentLessonId?: string;
  completedLessonIds: Set<string>;
  courseSlug: string;
}

export function Sidebar({
  structure,
  currentLessonId,
  completedLessonIds,
  courseSlug,
}: SidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Auto-expand the module containing the current lesson
    if (!currentLessonId) return new Set();
    for (const { module, lessons } of structure.modules) {
      if (lessons.some((l) => l.id === currentLessonId)) {
        return new Set([module.id]);
      }
    }
    return new Set();
  });

  const totalLessons = structure.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const completedCount = completedLessonIds.size;

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-serif font-bold text-gray-900 text-sm truncate">
          {structure.course.name}
        </h2>
        <ProgressBar
          value={completedCount}
          max={totalLessons}
          size="sm"
          className="mt-3"
        />
      </div>

      <nav className="py-2">
        {structure.modules.map(({ module, lessons }) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleCompleted = lessons.filter((l) =>
            completedLessonIds.has(l.id)
          ).length;

          return (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {module.name}
                </span>
                <span className="text-xs text-gray-400">
                  {moduleCompleted}/{lessons.length}
                </span>
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const isCompleted = completedLessonIds.has(lesson.id);

                    return (
                      <Link
                        key={lesson.id}
                        href={`/cours/${courseSlug}/${module.slug}/${lesson.slug}`}
                        className={`flex items-center gap-2 pl-10 pr-4 py-2 text-sm transition-colors ${
                          isCurrent
                            ? "bg-es-green/5 text-es-green font-medium border-r-2 border-es-green"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {isCompleted ? (
                          <svg
                            className="w-4 h-4 text-es-green shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                        )}
                        <span className="truncate">{lesson.name}</span>
                        {lesson.videoDuration && (
                          <span className="text-xs text-gray-400 ml-auto shrink-0">
                            {lesson.videoDuration}min
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
