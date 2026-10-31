// Shared question-game rules: Start → Question → Submit → Feedback → Continue → Results.
// Pure functions so the flow is deterministic and unit-testable.

export type McqQuestion = { kind: "mcq"; prompt: string; options: string[]; correct: number; explanation: string; hint?: string };
export type InputQuestion = { kind: "input"; prompt: string; accept: string[]; explanation: string; hint?: string; placeholder?: string };
/** Balance an equation: the answer is validated by counting atoms, not by string matching. */
export type BalanceQuestion = { kind: "balance"; reactants: string[]; products: string[]; explanation: string; hint?: string };
/** Count atoms in a formula: validated by parsing the formula. */
export type AtomCountQuestion = { kind: "atoms"; formula: string; explanation: string; hint?: string };
export type Question = McqQuestion | InputQuestion | BalanceQuestion | AtomCountQuestion;

export type Phase = "start" | "question" | "feedback" | "results";
export type Answer = { q: number; given: string; correct: boolean };
export type Session = { phase: Phase; order: number[]; i: number; answers: Answer[] };

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSession = (): Session => ({ phase: "start", order: [], i: 0, answers: [] });

/** Pick `count` distinct questions (no repeats within a session). */
export function startSession(bankSize: number, count: number, seed: number): Session {
  const r = rng(seed);
  const idx = Array.from({ length: bankSize }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j]!, idx[i]!]; }
  return { phase: "question", order: idx.slice(0, Math.min(count, bankSize)), i: 0, answers: [] };
}

/** Submitting is only possible during the question phase, so double-clicks cannot submit twice. */
export function submit(s: Session, given: string, correct: boolean): Session {
  if (s.phase !== "question") return s;
  return { ...s, phase: "feedback", answers: [...s.answers, { q: s.order[s.i]!, given, correct }] };
}

/** Continue only advances after feedback. */
export function advance(s: Session): Session {
  if (s.phase !== "feedback") return s;
  return s.i + 1 >= s.order.length ? { ...s, phase: "results" } : { ...s, phase: "question", i: s.i + 1 };
}

export const scoreOf = (s: Session) => s.answers.filter((a) => a.correct).length;

/* ---------- Chemistry validation ---------- */

const SUB: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
const plain = (f: string) => f.replace(/[₀-₉]/g, (c) => SUB[c] ?? c);
export const pretty = (f: string) => f.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)] ?? d);

/** Parse a formula like "Ca(OH)2" or "C6H12O6" into element counts. */
export function parseFormula(formula: string): Record<string, number> {
  const f = plain(formula);
  const stack: Record<string, number>[] = [{}];
  let i = 0;
  const num = () => { let n = ""; while (i < f.length && /\d/.test(f[i]!)) n += f[i++]; return n ? Number(n) : 1; };
  while (i < f.length) {
    const c = f[i]!;
    if (c === "(") { stack.push({}); i++; }
    else if (c === ")") {
      i++; const m = num(); const top = stack.pop()!; const cur = stack[stack.length - 1]!;
      for (const [k, v] of Object.entries(top)) cur[k] = (cur[k] ?? 0) + v * m;
    } else if (/[A-Z]/.test(c)) {
      let el = c; i++;
      while (i < f.length && /[a-z]/.test(f[i]!)) el += f[i++];
      const m = num(); const cur = stack[stack.length - 1]!; cur[el] = (cur[el] ?? 0) + m;
    } else throw new Error(`Bad formula: ${formula}`);
  }
  if (stack.length !== 1) throw new Error(`Bad formula: ${formula}`);
  return stack[0]!;
}

export const atomCount = (formula: string) => Object.values(parseFormula(formula)).reduce((a, b) => a + b, 0);

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** True when coefficients conserve every element and are in lowest whole-number terms. */
export function isBalanced(reactants: string[], products: string[], coeffs: number[]): boolean {
  if (coeffs.length !== reactants.length + products.length || coeffs.some((c) => !Number.isInteger(c) || c < 1)) return false;
  if (coeffs.reduce(gcd) !== 1) return false;
  const tally = (list: string[], cs: number[]) => {
    const t: Record<string, number> = {};
    list.forEach((f, k) => { for (const [el, n] of Object.entries(parseFormula(f))) t[el] = (t[el] ?? 0) + n * cs[k]!; });
    return t;
  };
  const l = tally(reactants, coeffs.slice(0, reactants.length));
  const r = tally(products, coeffs.slice(reactants.length));
  const els = new Set([...Object.keys(l), ...Object.keys(r)]);
  return [...els].every((e) => l[e] === r[e]);
}

export const parseCoeffs = (s: string) => s.split(/[\s,]+/).filter(Boolean).map(Number);
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

/** Validate any question type against its rule. */
export function check(q: Question, given: string): boolean {
  switch (q.kind) {
    case "mcq": return Number(given) === q.correct;
    case "input": return q.accept.some((a) => norm(a) === norm(given));
    case "balance": return isBalanced(q.reactants, q.products, parseCoeffs(given));
    case "atoms": return Number(given.trim()) === atomCount(q.formula);
  }
}

/** Human-readable correct answer for feedback. */
export function correctAnswer(q: Question): string {
  switch (q.kind) {
    case "mcq": return q.options[q.correct] ?? "";
    case "input": return q.accept[0] ?? "";
    case "atoms": return String(atomCount(q.formula));
    case "balance": return "See the explanation";
  }
}

export const promptOf = (q: Question) =>
  q.kind === "balance" ? `Balance: ${q.reactants.map((f) => `__ ${pretty(f)}`).join(" + ")} → ${q.products.map((f) => `__ ${pretty(f)}`).join(" + ")}`
  : q.kind === "atoms" ? `How many atoms in total are in one molecule of ${pretty(q.formula)}?`
  : q.prompt;
