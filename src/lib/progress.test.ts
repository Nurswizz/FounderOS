import { describe, expect, it } from "vitest";
import { computeProgress, nextSteps } from "./progress";

const done = new Date();
const items = [
  { id: "1", stage: "IDEA", order: 0, doneAt: done },
  { id: "2", stage: "IDEA", order: 1, doneAt: done },
  { id: "3", stage: "VALIDATION", order: 1, doneAt: null },
  { id: "4", stage: "VALIDATION", order: 0, doneAt: done },
  { id: "5", stage: "MVP", order: 0, doneAt: null },
] as const;

describe("computeProgress", () => {
  it("считает проценты по стадиям и общий прогресс", () => {
    const p = computeProgress([...items]);
    expect(p.overall).toBe(60);
    expect(p.byStage.IDEA).toEqual({ done: 2, total: 2, pct: 100 });
    expect(p.byStage.VALIDATION).toEqual({ done: 1, total: 2, pct: 50 });
    expect(p.byStage.GROWTH).toEqual({ done: 0, total: 0, pct: 0 });
  });

  it("текущая стадия — первая незавершённая", () => {
    expect(computeProgress([...items]).currentStage).toBe("VALIDATION");
  });

  it("всё выполнено или пусто — последняя/первая стадия", () => {
    expect(computeProgress([{ stage: "IDEA", doneAt: done }]).currentStage).toBe("GROWTH");
    expect(computeProgress([]).currentStage).toBe("IDEA");
    expect(computeProgress([]).overall).toBe(0);
  });
});

describe("nextSteps", () => {
  it("возвращает незавершённые задачи в порядке стадий и order", () => {
    expect(nextSteps([...items], 2).map((i) => i.id)).toEqual(["3", "5"]);
  });
});
