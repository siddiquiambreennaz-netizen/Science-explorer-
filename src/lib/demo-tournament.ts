// Practice tournament with clearly labelled, rule-based AI opponents. Nothing here is saved
// or shown as real students; results stay in the browser session only.
import { rng, type McqQuestion } from "@/lib/game-engine";
import { GAMES } from "@/data/game-banks";

export const QUESTION_SECONDS = 20;
export const ROUNDS = 5;

const NAMES = ["Nova", "Pixel", "Quark", "Comet", "Byte", "Helix", "Orbit", "Ion", "Spark", "Echo", "Nebula", "Bolt",
  "Prism", "Gizmo", "Atlas", "Zing", "Vector", "Luma", "Radar", "Fizz", "Cosmo", "Ember", "Tesla"];
const AVATARS = ["🤖", "🛰️", "🧪", "☄️", "💾", "🧬", "🪐", "⚛️", "⚡", "🔊", "🌌", "🔩", "🔷", "⚙️", "🗺️", "✨", "📐", "💡", "📡", "🫧", "🚀", "🔥", "🧲"];

export type Opponent = { id: string; name: string; avatar: string; skill: number; speed: number };

/** 23 consistent demo opponents. Skill = chance of a correct answer; speed = typical seconds used. */
export const OPPONENTS: Opponent[] = NAMES.map((n, i) => {
  const r = rng(1000 + i);
  return { id: `ai-${i}`, name: `${n} (AI)`, avatar: AVATARS[i] ?? "🤖", skill: 0.35 + r() * 0.55, speed: 4 + r() * 12 };
});

/** Same scoring for everyone: 100 points per correct answer plus up to 50 for speed. */
export function points(correct: boolean, secondsUsed: number): number {
  if (!correct) return 0;
  const remaining = Math.max(0, QUESTION_SECONDS - secondsUsed);
  return 100 + Math.round((remaining / QUESTION_SECONDS) * 50);
}

/** Reproducible opponent result for a given tournament seed and round. */
export function opponentRound(o: Opponent, seed: number, round: number): { correct: boolean; seconds: number } {
  const r = rng(seed * 31 + round * 997 + Number(o.id.slice(3)) * 7919);
  const correct = r() < o.skill;
  const seconds = Math.min(QUESTION_SECONDS, Math.max(2, o.speed + (r() - 0.5) * 6));
  return { correct, seconds: Math.round(seconds) };
}

/** Mixed-subject multiple-choice pool for the tournament. */
export function tournamentQuestions(seed: number): McqQuestion[] {
  const pool = GAMES.filter((g) => !g.timed).flatMap((g) => g.questions.filter((q): q is McqQuestion => q.kind === "mcq"));
  const r = rng(seed);
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j]!, idx[i]!]; }
  return idx.slice(0, ROUNDS).map((i) => pool[i]!);
}
