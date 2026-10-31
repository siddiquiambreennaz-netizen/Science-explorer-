import { describe, expect, it } from "vitest";
import { advance, atomCount, check, isBalanced, startSession, submit, scoreOf } from "@/lib/game-engine";
import { GAMES } from "@/data/game-banks";
import { OPPONENTS, opponentRound, points } from "@/lib/demo-tournament";

describe("game flow", () => {
  it("picks 5 distinct questions", () => {
    const s = startSession(9, 5, 42);
    expect(s.order).toHaveLength(5);
    expect(new Set(s.order).size).toBe(5);
  });
  it("ignores a second submit and only advances after feedback", () => {
    let s = startSession(9, 5, 1);
    expect(advance(s)).toBe(s);
    s = submit(s, "x", true);
    expect(submit(s, "y", true).answers).toHaveLength(1);
    s = advance(s);
    expect(s.i).toBe(1);
    expect(s.phase).toBe("question");
  });
  it("shows results after the fifth answer and scores correctly", () => {
    let s = startSession(9, 5, 3);
    for (let i = 0; i < 5; i++) s = advance(submit(s, "", i % 2 === 0));
    expect(s.phase).toBe("results");
    expect(scoreOf(s)).toBe(3);
  });
});

describe("chemistry validation", () => {
  it("validates balancing by atom conservation", () => {
    expect(isBalanced(["H2", "O2"], ["H2O"], [2, 1, 2])).toBe(true);
    expect(isBalanced(["H2", "O2"], ["H2O"], [4, 2, 4])).toBe(false);
    expect(isBalanced(["Fe", "O2"], ["Fe2O3"], [4, 3, 2])).toBe(true);
    expect(isBalanced(["CH4", "O2"], ["CO2", "H2O"], [1, 1, 1, 1])).toBe(false);
  });
  it("counts atoms including brackets", () => {
    expect(atomCount("Ca(OH)2")).toBe(5);
    expect(atomCount("C6H12O6")).toBe(24);
  });
  it("every built-in balancing answer key is genuinely balanced", () => {
    const eq = GAMES.find((g) => g.id === "equation-balancing")!;
    const keys = ["2,1,2", "1,2,1,2", "1,3,2", "2,1,2", "2,1,2", "4,3,2", "1,5,3,4", "4,3,2", "2,2,3"];
    eq.questions.forEach((q, i) => expect(check(q, keys[i]!)).toBe(true));
  });
  it("every multiple-choice answer index is valid", () => {
    for (const g of GAMES) for (const q of g.questions) if (q.kind === "mcq") expect(q.correct).toBeLessThan(q.options.length);
  });
});

describe("demo tournament", () => {
  it("has 23 clearly labelled AI opponents", () => {
    expect(OPPONENTS).toHaveLength(23);
    expect(OPPONENTS.every((o) => o.name.endsWith("(AI)"))).toBe(true);
  });
  it("opponent results are reproducible", () => {
    expect(opponentRound(OPPONENTS[0]!, 7, 2)).toEqual(opponentRound(OPPONENTS[0]!, 7, 2));
  });
  it("scores 0 for wrong and 100-150 for right", () => {
    expect(points(false, 1)).toBe(0);
    expect(points(true, 20)).toBe(100);
    expect(points(true, 0)).toBe(150);
  });
});
