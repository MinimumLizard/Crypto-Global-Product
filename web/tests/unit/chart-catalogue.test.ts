import { describe, expect, test } from "vitest";

import messages from "@/messages/en.json";
import { CATEGORIES, CHARTS, DATA_COST, DATA_NEEDS, chartTier, isLive } from "@/lib/chart-catalogue";
import { MODEL_NAMES } from "@/lib/registry";

describe("chart catalogue", () => {
  test("every chart has a unique slug, a known category and its full text", () => {
    expect(new Set(CHARTS.map((c) => c.slug)).size).toBe(CHARTS.length);
    const items = messages.charts.items as Record<string, Record<string, string>>;
    for (const c of CHARTS) {
      expect(CATEGORIES).toContain(c.category);
      for (const part of ["title", "summary", "what", "how", "read"]) expect(items[c.slug]?.[part], `${c.slug}.${part}`).toBeTruthy();
    }
    expect(Object.keys(items).sort()).toEqual(CHARTS.map((c) => c.slug).sort());
  });

  test("every kind of data says what it costs, and every category has its text", () => {
    for (const need of DATA_NEEDS) {
      expect(["free", "licence", "paid"]).toContain(DATA_COST[need]);
      expect((messages.charts.data as Record<string, { short: string; long: string }>)[need].long).toBeTruthy();
    }
    for (const cat of CATEGORIES) expect((messages.charts.categories as Record<string, { title: string }>)[cat].title).toBeTruthy();
  });

  test("a live chart's tier is the highest tier among the models it reads", () => {
    for (const c of CHARTS.filter(isLive)) for (const m of c.models) expect(MODEL_NAMES).toContain(m);
    const mb = CHARTS.find((c) => c.slug === "multiplier-bands")!;
    expect(chartTier(mb)).toBe("plus");                       // crypto_market is free, crypto_charts is plus
    expect(chartTier(CHARTS.find((c) => c.slug === "since-first-close")!)).toBe("free");
    expect(chartTier(CHARTS.find((c) => c.slug === "dominance")!)).toBeNull();
    expect(chartTier(CHARTS.find((c) => c.slug === "hash-rate")!)).toBe("plus");
  });
});
