import { Card } from "@/components/ui/Card";
import type { LearnerStats } from "@/lib/platform/stats";

interface Props {
  stats: LearnerStats;
  coachingRemaining: number;
  coachingTotal: number;
}

/**
 * Vue d'ensemble hebdomadaire de l'eleve sur le dashboard.
 *
 * Layout en 1 grande card :
 *  - A gauche : titre + chiffre principal "X leçons cette semaine" + streak en
 *    chip + meta-info temps total visionnage et coachings restants
 *  - A droite : mini bar chart des 7 derniers jours (J-6 a aujourd'hui)
 *
 * Le mini-chart est en pur CSS/SVG, pas de lib. La hauteur des barres est
 * normalisee sur le max des 7 jours (avec un min de 1 pour qu'une barre soit
 * toujours visible) plutot que sur un absolu, pour rester lisible meme quand
 * l'eleve enchaine 1 leçon/jour.
 */
export function WeeklyOverview({ stats, coachingRemaining, coachingTotal }: Props) {
  const { dailyActivity, streakDays, watchedMinutes, completedThisWeek } = stats;
  const maxCount = Math.max(1, ...dailyActivity.map((d) => d.count));
  const watchedLabel = formatWatch(watchedMinutes);

  return (
    <Card className="bg-gradient-to-br from-white to-es-cream/30">
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-8">
        {/* Colonne gauche : chiffres */}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Cette semaine</p>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="font-serif text-5xl font-bold text-gray-900 leading-none">
              {completedThisWeek}
            </span>
            <span className="text-gray-500 text-base">
              {completedThisWeek <= 1 ? "leçon terminée" : "leçons terminées"}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            {completedThisWeek === 0
              ? "Tu n'as rien terminé cette semaine. Une petite leçon avant ce soir ?"
              : completedThisWeek < 3
                ? "Continue sur ta lancée, encore quelques leçons cette semaine."
                : "Tu tiens un super rythme. Bravo."}
          </p>

          {/* Chips meta */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StreakChip streakDays={streakDays} />
            <MetaChip
              label={watchedLabel}
              sublabel={watchedLabel === "0 min" ? "de visionnage" : "regardées au total"}
            />
            {coachingTotal > 0 && (
              <MetaChip
                label={`${coachingRemaining} / ${coachingTotal}`}
                sublabel="coachings restants"
              />
            )}
          </div>
        </div>

        {/* Colonne droite : mini bar chart */}
        <div className="lg:w-64 shrink-0">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">7 derniers jours</p>
          <div className="flex items-end gap-1.5 h-24">
            {dailyActivity.map((d) => {
              const heightPct = Math.round((d.count / maxCount) * 100);
              const hasActivity = d.count > 0;
              return (
                <div key={d.isoDay} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-md transition-all ${
                        hasActivity
                          ? d.isToday
                            ? "bg-es-green"
                            : "bg-es-green/50"
                          : "bg-gray-100"
                      }`}
                      style={{ height: hasActivity ? `${Math.max(heightPct, 12)}%` : "6px" }}
                      title={`${d.dayLabel} : ${d.count} leçon${d.count > 1 ? "s" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      d.isToday ? "text-es-green font-semibold" : "text-gray-400"
                    }`}
                  >
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StreakChip({ streakDays }: { streakDays: number }) {
  if (streakDays === 0) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
        <FlameIcon active={false} />
        Streak en pause
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-es-gold/15 text-es-gold-dark text-xs font-semibold">
      <FlameIcon active />
      {streakDays} jour{streakDays > 1 ? "s" : ""} d&apos;affilée
    </span>
  );
}

function MetaChip({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">
      <span className="font-semibold text-gray-900">{label}</span>
      <span className="text-gray-400">{sublabel}</span>
    </span>
  );
}

function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${active ? "text-es-gold-dark" : "text-gray-400"}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.5 2c.4 1.5.1 3-.7 4.2-.8 1.3-2 2.2-2.6 3.6-.6 1.4-.3 2.9.5 4-1.3-.4-2.4-1.4-2.9-2.7-.5-1.3-.4-2.7.2-4-1.1 1-1.9 2.3-2.2 3.8-.6 2.9.8 5.9 3.4 7.4 2.6 1.5 5.9 1.2 8.2-.7s3-5 1.7-7.6c-.5-1.1-1.4-2-2.2-2.8-1.3-1.3-2.4-2.7-3.4-5.2z" />
    </svg>
  );
}

function formatWatch(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
