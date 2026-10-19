import { describe, expect, test } from "vitest";

import { sparkline } from "@/lib/sparkline";

describe("sparkline", () => {
  test("scales the series into the box, highest point at the top", () => {
    const s = sparkline([1, 3, 2], 100, 20)!;
    expect(s.line).toBe("M0 18 L50 2 L100 10");
    expect(s.area.endsWith("L100 20 L0 20 Z")).toBe(true);
  });
  test("needs two numbers", () => {
    expect(sparkline([1, null])).toBeNull();
    expect(sparkline([5, 5])!.line).toBe("M0 30 L120 30");   // a flat series sits on the floor
  });
});
