import { expect, test } from "vitest";

import messages from "@/messages/en.json";
import { CHARTS } from "@/lib/chart-catalogue";
import { LESSONS } from "@/lib/lessons";
import { FOCUS, PATHS, stepHref, stepsFor } from "@/lib/onboarding";

test("every path has its text, and every option leads to three steps that exist", () => {
  const paths = messages.start.paths as Record<string, { options: Record<string, string>; question: string; title: string }>;
  const lessons = LESSONS.map((l) => l.slug) as string[];
  const charts = CHARTS.map((c) => c.slug);
  for (const p of PATHS) {
    expect(paths[p].title && paths[p].question).toBeTruthy();
    expect(Object.keys(paths[p].options).sort()).toEqual(Object.keys(FOCUS[p]).sort());
    for (const steps of Object.values(FOCUS[p])) {
      expect(steps).toHaveLength(3);
      for (const s of steps) {
        if ("lesson" in s) expect(lessons).toContain(s.lesson);
        if ("chart" in s) expect(charts).toContain(s.chart);
      }
    }
  }
});

test("an unknown or missing answer falls back to the first option", () => {
  expect(stepsFor("new", undefined).focus).toBe("how-it-works");
  expect(stepsFor("new", "constructor").focus).toBe("how-it-works");
  expect(stepHref(stepsFor("holder", "charts").steps[1])).toBe("/charts/long-averages");
});
