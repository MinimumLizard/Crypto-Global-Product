import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CHARTS, isLive } from "@/lib/chart-catalogue";
import { CRYPTO_ASSETS } from "@/lib/crypto-display";
import { LESSONS } from "@/lib/lessons";
import messages from "@/messages/en.json";

const script = readFileSync(join(__dirname, "../../public/terminal.js"), "utf8");

describe("public/terminal.js (watchlist, portfolio, search)", () => {
  it("never sends anything anywhere: the visitor's coins stay in their browser", () => {
    for (const api of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "document.cookie", "navigator.geolocation"]) {
      expect(script, api).not.toContain(api);
    }
  });

  it("guards every storage access (private browsing throws)", () => {
    const uses = script.match(/localStorage\.\w+/g) ?? [];
    expect(uses.length).toBeGreaterThan(0);
    // Both calls live inside the one store helper, each inside a try.
    for (const line of script.split("\n").filter((l) => l.includes("localStorage."))) {
      expect(line).toMatch(/try \{/);
    }
  });

  it("creates no links of its own (every link is server-rendered, so static copies keep working)", () => {
    expect(script).not.toMatch(/createElement\(\s*["']a["']/);
    expect(script).not.toMatch(/\.href\s*=/);
    expect(script).not.toMatch(/innerHTML/);
  });
});

describe("site search index", () => {
  const get = (path: string): unknown => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages);

  it("has a title for every coin, live chart and lesson it lists", () => {
    const keys = [
      ...CRYPTO_ASSETS.map((a) => `crypto.assets.${a.slug}`),
      ...CHARTS.filter(isLive).map((c) => `charts.items.${c.slug}.title`),
      ...LESSONS.map((l) => `basics.lessons.${l.slug}.title`),
      "nav.start", "nav.portfolio", "nav.plans", "nav.methods",
      "search.coin", "search.chart", "search.lesson", "search.page", "search.placeholder", "search.label",
    ];
    for (const k of keys) expect(typeof get(k), k).toBe("string");
  });
});
