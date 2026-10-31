import { describe, expect, it } from "vitest";
import { dailyQuests, levelFromXp, streakFrom, xpFrom, XP_PER_LEVEL, XP_PER_QUIZ_POINT, XP_PER_TOPIC } from "@/lib/gamification";

const r = (score: number, total: number, created_at: string) => ({ score, total, created_at });

describe("XP rules", () => {
  it("awards 10 XP per quiz point and 25 XP per completed topic", () => {
    expect(xpFrom([r(3, 5, "2026-10-27T10:00:00"), r(5, 5, "2026-10-27T11:00:00")], 2)).toBe(
      8 * XP_PER_QUIZ_POINT + 2 * XP_PER_TOPIC,
    );
  });

  it("starts at level 1 and levels up every 150 XP", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(XP_PER_LEVEL - 1).level).toBe(1);
    expect(levelFromXp(XP_PER_LEVEL).level).toBe(2);
    expect(levelFromXp(XP_PER_LEVEL).intoLevel).toBe(0);
    expect(levelFromXp(3 * XP_PER_LEVEL + 40).level).toBe(4);
  });
});

describe("streak rules", () => {
  const now = new Date(2026, 9, 27, 18, 0); // Oct 27 2026, local
  it("counts consecutive days ending today", () => {
    expect(streakFrom(["2026-10-27T08:00:00", "2026-10-26T08:00:00", "2026-10-25T08:00:00"], now)).toBe(3);
  });
  it("keeps the streak alive when only yesterday has activity", () => {
    expect(streakFrom(["2026-10-26T08:00:00", "2026-10-25T08:00:00"], now)).toBe(2);
  });
  it("breaks the streak when a full day was missed", () => {
    expect(streakFrom(["2026-10-25T08:00:00"], now)).toBe(0);
  });
});

describe("daily quests", () => {
  const now = new Date(2026, 9, 27, 18, 0);
  it("marks the quiz quest done only for a quiz taken today", () => {
    const quests = dailyQuests([r(4, 5, "2026-10-26T08:00:00")], [], now);
    expect(quests.find((q) => q.id === "quiz")!.done).toBe(false);
    const quests2 = dailyQuests([r(4, 5, "2026-10-27T08:00:00")], [], now);
    expect(quests2.find((q) => q.id === "quiz")!.done).toBe(true);
  });
  it("marks the 80% quest done only for a high score today", () => {
    expect(dailyQuests([r(2, 5, "2026-10-27T08:00:00")], [], now).find((q) => q.id === "ace")!.done).toBe(false);
    expect(dailyQuests([r(4, 5, "2026-10-27T08:00:00")], [], now).find((q) => q.id === "ace")!.done).toBe(true);
  });
  it("marks the topic quest done only for a topic completed today", () => {
    expect(dailyQuests([], [{ completed_at: "2026-10-27T09:00:00" }], now).find((q) => q.id === "topic")!.done).toBe(true);
    expect(dailyQuests([], [{ completed_at: "2026-10-20T09:00:00" }], now).find((q) => q.id === "topic")!.done).toBe(false);
  });
});
