import type { SupabaseClient } from "@supabase/supabase-js";

export interface LearnerStats {
  /** Leçons terminées au total (toutes formations confondues). */
  totalCompleted: number;
  /** Leçons terminées ces 7 derniers jours (rolling). */
  completedThisWeek: number;
  /** Streak : nombre de jours consecutifs avec au moins 1 leçon complétée,
   * en partant d'aujourd'hui (ou hier si rien fait aujourd'hui). 0 si pas
   * de leçon dans les 24h écoulées ni la veille. */
  streakDays: number;
  /** Temps de visionnage estime en minutes, base sur la durée video des leçons
   * complétées. Approximation : on multiplie progress.count par 25 min/leçon
   * moyenne si on n'a pas la durée par leçon. */
  watchedMinutes: number;
  /** Activite des 7 derniers jours (du plus ancien au plus récent).
   * Chaque entry = un jour, avec son label court (Lun, Mar...) et le nb de
   * leçons complétées ce jour-la. Utilise pour le mini-graphe hebdo. */
  dailyActivity: Array<{ dayLabel: string; isoDay: string; count: number; isToday: boolean }>;
}

interface ProgressRow {
  completed_at: string | null;
  lesson_id: string | null;
}

/**
 * Calcule les stats de progression d'un eleve.
 *
 * Strategie : on fetch toutes les rows de progress de l'user (au plus quelques
 * centaines pour Academy = 66 leçons + future formations) et on agrege en
 * memoire. Plus rapide qu'un round-trip par stat, et plus simple a tester.
 *
 * Pour le streak, on prend la date de completion (UTC) et on regarde les
 * jours consecutifs en partant d'aujourd'hui. On accepte un "jour de grace"
 * (si l'eleve n'a rien fait aujourd'hui mais a fait quelque chose hier, on
 * compte le streak depuis hier) sinon le streak casse a chaque fois qu'on
 * regarde le dashboard tot le matin.
 */
export async function getLearnerStats(
  supabase: SupabaseClient,
  userId: string,
  avgMinutesPerLesson = 25,
): Promise<LearnerStats> {
  const { data } = await supabase
    .from("progress")
    .select("completed_at, lesson_id")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1000);

  const rows: ProgressRow[] = data || [];
  const totalCompleted = rows.length;

  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const completedThisWeek = rows.filter(
    (r) => r.completed_at && nowMs - new Date(r.completed_at).getTime() < sevenDaysMs,
  ).length;

  const streakDays = computeStreak(rows.map((r) => r.completed_at).filter(Boolean) as string[]);
  const watchedMinutes = Math.round(totalCompleted * avgMinutesPerLesson);
  const dailyActivity = buildDailyActivity(rows.map((r) => r.completed_at).filter(Boolean) as string[]);

  return { totalCompleted, completedThisWeek, streakDays, watchedMinutes, dailyActivity };
}

/**
 * Construit l'activite des 7 derniers jours pour le mini-graphe hebdo.
 * Ordre chronologique (J-6 a aujourd'hui) pour que l'eleve lise de gauche
 * a droite, comme un calendrier.
 */
function buildDailyActivity(
  completedAts: string[],
): Array<{ dayLabel: string; isoDay: string; count: number; isToday: boolean }> {
  const countByDay = new Map<string, number>();
  for (const iso of completedAts) {
    const key = toParisDay(new Date(iso));
    countByDay.set(key, (countByDay.get(key) || 0) + 1);
  }

  const today = toParisDay(new Date());
  const result: Array<{ dayLabel: string; isoDay: string; count: number; isToday: boolean }> = [];
  const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const isoDay = toParisDay(d);
    result.push({
      dayLabel: dayLabels[d.getDay()],
      isoDay,
      count: countByDay.get(isoDay) || 0,
      isToday: isoDay === today,
    });
  }
  return result;
}

/**
 * Compte le nombre de jours consecutifs avec au moins 1 leçon complétée.
 * Logique : on construit le Set des jours (YYYY-MM-DD en heure locale Europe/Paris)
 * presents dans completed_at, puis on remonte depuis aujourd'hui jour par jour.
 *
 * Tolerance : si rien aujourd'hui mais quelque chose hier, on commence le compte
 * a hier. Sinon le streak casse trop facilement (un eleve qui ouvre l'app le
 * matin n'a "rien fait aujourd'hui" => streak 0 => demotivation).
 */
export function computeStreak(completedAts: string[]): number {
  if (completedAts.length === 0) return 0;

  const days = new Set<string>();
  for (const iso of completedAts) {
    days.add(toParisDay(new Date(iso)));
  }

  const today = toParisDay(new Date());
  const yesterday = toParisDay(new Date(Date.now() - 24 * 60 * 60 * 1000));

  let cursor: Date;
  if (days.has(today)) {
    cursor = parisDayToDate(today);
  } else if (days.has(yesterday)) {
    cursor = parisDayToDate(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(toParisDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

/** Convertit une Date JS en cle "YYYY-MM-DD" Europe/Paris.
 * Nécessaire car le streak doit s'aligner sur les jours de l'utilisateur, pas
 * sur UTC (sinon un user qui termine une leçon a 22h Paris en hiver = 21h UTC
 * et le jour glisse).
 */
function toParisDay(d: Date): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value || "";
  const m = parts.find((p) => p.type === "month")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  return `${y}-${m}-${day}`;
}

function parisDayToDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00Z`);
}
