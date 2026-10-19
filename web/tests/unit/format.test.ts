import { expect, test } from "vitest";

import { NONE, num, pct, signed } from "@/lib/format";

test("numbers", () => {
  expect(num(1234.567)).toBe("1,234.57");
  expect(num(-1.5, 1)).toBe("−1.5");
  expect(num(null)).toBe(NONE);
  expect(signed(0.5, 1)).toBe("+0.5");
  expect(signed(0, 1)).toBe("±0.0");
  expect(pct(0.0123)).toBe("+1.23%");
  expect(pct(Number.NaN)).toBe(NONE);
});

