import { RESOURCES, type ResourceEntry } from "@/lib/ressources-manifest";
import type { CourseStructure } from "@/lib/notion/types";

/**
 * Retourne les N ressources liees au module en cours d'avancement.
 *
 * "Récentes" est trompeur dans notre cas : le manifeste statique n'a pas de
 * date de creation par ressource. On fait donc un proxy utile : on prend
 * les ressources du module dans lequel l'eleve a sa dernière leçon complétée
 * (ou du premier module si rien fait). C'est ce que l'eleve veut voir en
 * priorite sur son dashboard.
 *
 * Si l'eleve n'a aucune progression, on retourne les ressources du module 1.
 */
export function getRelevantResources(
  structure: CourseStructure | null,
  completedLessonIds: Set<string>,
  limit = 3,
): ResourceEntry[] {
  let currentModuleOrder = 1;

  if (structure) {
    let lastIdx = -1;
    structure.modules.forEach(({ module, lessons }, moduleIdx) => {
      for (const lesson of lessons) {
        if (completedLessonIds.has(lesson.id) && moduleIdx > lastIdx) {
          lastIdx = moduleIdx;
          currentModuleOrder = module.order || moduleIdx + 1;
        }
      }
    });
  }

  const inCurrent = RESOURCES.filter(
    (r) => r.moduleNum === currentModuleOrder && r.available,
  );
  if (inCurrent.length >= limit) return inCurrent.slice(0, limit);

  const inNext = RESOURCES.filter(
    (r) => r.moduleNum > currentModuleOrder && r.available,
  );
  return [...inCurrent, ...inNext].slice(0, limit);
}
