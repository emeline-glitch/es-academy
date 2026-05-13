import type { CourseStructure } from "@/lib/notion/types";

export interface RecommendedLesson {
  courseSlug: string;
  moduleSlug: string;
  moduleName: string;
  lessonSlug: string;
  lessonName: string;
  lessonId: string;
  /** Position globale dans le cours (1-indexed). Pratique pour le wording
   * "Leçon 12 / 66". */
  position: number;
  /** Total leçons du cours. */
  total: number;
}

/**
 * Trouve la prochaine leçon a faire dans une structure de cours, en sautant
 * les leçons déjà complétées.
 *
 * Strategie : on parcourt les modules dans l'ordre Notion (module.order) et
 * dans chaque module les leçons dans l'ordre. On renvoie la première non
 * complétée. Si tout est complete on renvoie null (l'eleve a fini le cours).
 *
 * Cas limite : si la structure est vide (pas de modules), null aussi.
 */
export function findNextLesson(
  courseSlug: string,
  structure: CourseStructure,
  completedLessonIds: Set<string>,
): RecommendedLesson | null {
  let position = 0;
  let total = 0;

  for (const { lessons } of structure.modules) total += lessons.length;
  if (total === 0) return null;

  for (const { module, lessons } of structure.modules) {
    for (const lesson of lessons) {
      position += 1;
      if (!completedLessonIds.has(lesson.id)) {
        return {
          courseSlug,
          moduleSlug: module.slug,
          moduleName: module.name,
          lessonSlug: lesson.slug,
          lessonName: lesson.name,
          lessonId: lesson.id,
          position,
          total,
        };
      }
    }
  }
  return null;
}

/**
 * Calcule pour chaque module : completion (0..1) + statut.
 *
 * Statut :
 *  - "completed" : toutes les leçons complétées
 *  - "in_progress" : au moins 1 leçon complétée, au moins 1 non complétée
 *  - "available" : aucune leçon complétée mais module accessible
 *  - "locked" : non utilise pour l'instant, Academy est full unlock
 *
 * On renvoie un tableau dans le meme ordre que structure.modules pour que la
 * page module puisse zip facilement.
 */
export type ModuleStatus = "completed" | "in_progress" | "available" | "locked";

export interface ModuleProgress {
  moduleId: string;
  completed: number;
  total: number;
  percent: number;
  status: ModuleStatus;
  /** Somme des durées video des leçons du module (en min). 0 si pas de durée
   * sur les rows Notion. */
  durationMinutes: number;
}

export function computeModuleProgress(
  structure: CourseStructure,
  completedLessonIds: Set<string>,
): ModuleProgress[] {
  return structure.modules.map(({ module, lessons }) => {
    const total = lessons.length;
    const completed = lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    let status: ModuleStatus;
    if (total === 0) status = "available";
    else if (completed === total) status = "completed";
    else if (completed > 0) status = "in_progress";
    else status = "available";

    const durationMinutes = lessons.reduce(
      (sum, l) => sum + (l.videoDuration || 0),
      0,
    );

    return { moduleId: module.id, completed, total, percent, status, durationMinutes };
  });
}
