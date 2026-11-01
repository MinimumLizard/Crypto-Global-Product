import { describe, expect, test } from "vitest";

import { cyclePaths, quarterGrid, seasonality } from "@/lib/overlays";

const closes = [
  { day: "2024-01-01", close: 10 }, { day: "2024-01-02", close: 20 }, { day: "2024-01-03", close: 15 },
  { day: "2024-01-04", close: 30 }, { day: "2024-01-05", close: 60 }, { day: "2024-01-06", close: 45 },
];
const anchors = [
  { kind: "cycle_low", epoch: 1, anchor_day: "2024-01-01", anchor_close: 10 },
  { kind: "cycle_low", epoch: 2, anchor_day: "2024-01-03", anchor_close: 15, provisional: true },
  { kind: "halving", epoch: 2, anchor_day: "2024-01-02", anchor_close: 20 },
];

describe("cycle paths", () => {
  test("each path starts at 1 on its anchor and runs to the next anchor of the same kind", () => {
    const paths = cyclePaths(closes, anchors, "cycle_low", 1);
    expect(paths).toHaveLength(2);
    expect(paths[0].points).toEqual([[0, 1], [1, 2], [2, 1.5]]);
    expect(paths[1]).toMatchObject({ epoch: 2, provisional: true });
    expect(paths[1].points.at(-1)).toEqual([3, 3]);
  });
  test("thinning keeps the last point", () => {
    const paths = cyclePaths(closes, anchors, "halving", 2);
    expect(paths[0].points).toEqual([[0, 1], [2, 1.5], [4, 2.25]]);
  });
});

describe("seasonality and quarters", () => {
  test("averages each calendar month across years", () => {
    const s = seasonality([{ month: "2023-01-01", ret_month: 0.1 }, { month: "2024-01-01", ret_month: -0.3 },
                           { month: "2025-01-01", ret_month: 0.2 }, { month: "2024-02-01", ret_month: null }]);
    expect(s[0].mean).toBeCloseTo(0, 10);
    expect(s[0].median).toBe(0.1);
    expect(s[0].positive).toBeCloseTo(2 / 3);
    expect(s[1].count).toBe(0);
  });
  test("lays quarters out by year, latest year first", () => {
    expect(quarterGrid([["2024-03-31", 0.1], ["2024-12-31", -0.2], ["2025-06-30", 0.3]])).toEqual([
      { year: 2025, q: [null, 0.3, null, null] }, { year: 2024, q: [0.1, null, null, -0.2] },
    ]);
  });
});
