import { describe, expect, it } from "vitest";
import { physicsAnswerCorrect, physicsProgressSlug } from "@/lib/physics-playlab";
describe("Physics mission validation", () => {
  it.each([[0, 2], [1, 0], [2, 1], [3, 2], [4, 1], [5, 0]])("validates mission %i correctly", (mission, answer) => {
    expect(physicsAnswerCorrect(mission, answer)).toBe(true);
    expect(physicsAnswerCorrect(mission, (answer + 1) % 3)).toBe(false);
  });
  it("uses one stable progress identity per mission on replay", () => {
    expect(physicsProgressSlug("gravity")).toBe("physics-playlab-gravity");
  });
});