import { describe, expect, it } from "vitest";
import { groupMetrics } from "./metrics";

describe("groupMetrics", () => {
  it("группирует по ключу в хронологическом порядке, последнее значение — latest", () => {
    const d = (day: number) => new Date(2026, 0, day);
    const groups = groupMetrics([
      { key: "mrr", value: 300, capturedAt: d(3) },
      { key: "stars", value: 5, capturedAt: d(1) },
      { key: "mrr", value: 100, capturedAt: d(1) },
    ]);

    expect(groups.map((g) => g.key)).toEqual(["mrr", "stars"]);
    expect(groups[0].values).toEqual([100, 300]);
    expect(groups[0].latest).toBe(300);
  });
});
