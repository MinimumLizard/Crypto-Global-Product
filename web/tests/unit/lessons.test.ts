import { expect, test } from "vitest";

import messages from "@/messages/en.json";
import { CHARTS } from "@/lib/chart-catalogue";
import { LESSONS } from "@/lib/lessons";

test("every lesson has its text, and every chart it points to exists", () => {
  const all = messages.basics.lessons as Record<string, { title: string; sections: unknown[]; points: string[] }>;
  expect(Object.keys(all).sort()).toEqual(LESSONS.map((l) => l.slug).sort());
  for (const l of LESSONS) {
    expect(all[l.slug].title).toBeTruthy();
    expect(all[l.slug].sections.length).toBeGreaterThan(0);
    expect(all[l.slug].points.length).toBeGreaterThan(0);
    for (const href of l.see) if (href.startsWith("/charts/")) expect(CHARTS.map((c) => `/charts/${c.slug}`)).toContain(href);
  }
});
