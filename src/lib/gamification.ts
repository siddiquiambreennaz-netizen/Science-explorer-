// Gamification rules — XP, levels, streaks and daily quests are DERIVED from real
// activity rows (quiz_results, topic_progress). Nothing here is awarded for fake actions.

export type QuizResultLike = { score: number; total: number; created_at: string };
export type TopicLike = { completed_at: string };

export const XP_PER_QUIZ_POINT = 10;
export const XP_PER_TOPIC = 25;
export const XP_PER_LEVEL = 150;

/** Total XP from quiz points scored and topics completed. */
export function xpFrom(results: QuizResultLike[], topicsDone: number): number {
  return results.reduce((s, r) => s + r.score * XP_PER_QUIZ_POINT, 0) + topicsDone * XP_PER_TOPIC;
}

/** Level progress: every XP_PER_LEVEL XP is one level, starting at level 1. */
export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number; pct: number } {
  const safe = Math.max(0, xp);
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const intoLevel = safe % XP_PER_LEVEL;
  return { level, intoLevel, needed: XP_PER_LEVEL, pct: Math.round((intoLevel / XP_PER_LEVEL) * 100) };
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/**
 * Consecutive active days ending today (or yesterday if today has no activity yet —
 * the streak is still alive until a full day is missed).
 */
export function streakFrom(isoDates: string[], now: Date = new Date()): number {
  const days = new Set(isoDates.map((iso) => dayKey(new Date(iso))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type Quest = { id: string; label: string; reward: number; done: boolean };

/** Daily quests, checked against what the student actually did today. */
export function dailyQuests(results: QuizResultLike[], topics: TopicLike[], now: Date = new Date()): Quest[] {
  const today = dayKey(now);
  const todayResults = results.filter((r) => dayKey(new Date(r.created_at)) === today);
  const todayTopics = topics.filter((t) => dayKey(new Date(t.completed_at)) === today);
  return [
    { id: "quiz", label: "Take any quiz", reward: 20, done: todayResults.length >= 1 },
    { id: "topic", label: "Complete a learning topic", reward: 25, done: todayTopics.length >= 1 },
    { id: "ace", label: "Score 80% or more on a quiz", reward: 30, done: todayResults.some((r) => r.total > 0 && r.score / r.total >= 0.8) },
  ];
}
