// THE TIER-LEAK SUITE (docs/architecture.md §8; hard rule 4: paid data never reaches an unentitled browser or e-mail). Run against a server started on the database seeded
// by tests/leak/seed.py, with ALLOW_TEST_TIERS=1 so each request can act as a tier:
//
//   uv run python web/tests/leak/seed.py           # prints the DATABASE_URL for the server
//   (cd web && DATABASE_URL=... ALLOW_TEST_TIERS=1 npx next start -p 3100 &) ; cd web && npm run test:leak
//
// For every model and every tier, every API route and every page that shows the model is requested, and:
//   * below the model's tier, none of its marker values appears (raw or formatted), and the page says it is locked;
//   * with a free preview, only the old date's markers appear, never the recent ones;
//   * at or above the tier, the markers DO appear (so the test cannot pass by showing nothing).
// The weekly e-mail is checked through its preview page, built exactly as a sent e-mail is.
// Reference versions and unpublished statistics must never appear for anyone.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { ALL_PAGES, DETAIL_PAGES, MODEL_ROUTES } from "@/lib/routes";
import { MODEL_NAMES, TIERS, type ModelName, type Tier, modelEntry } from "@/lib/registry";

const BASE = process.env.LEAK_BASE_URL ?? "http://127.0.0.1:3100";
interface Markers {
  api: string[];
  page: string[];
}
const markers = JSON.parse(fs.readFileSync(path.join(__dirname, "markers.json"), "utf8")) as {
  new: string;
  mid: string;
  old: string;
  models: Record<string, { new: Markers; old: Markers; mid?: Markers }>;
  recent_window: Record<string, Markers & { before: string }>;
  email: Record<string, string[]>;
  crypto_page: Record<string, { new: string[]; old: string[]; mid?: string[] }>;
  never: string[];
};

// Detail pages and routes with a parameter, for the checks that apply to every page (the seeded assets).
const DETAIL = [...DETAIL_PAGES, "/api/v1/crypto/cycle?pair=btcusd", "/api/v1/crypto/cycle?pair=ethusd"];

async function get(url: string, tier: Tier | null) {
  const res = await fetch(BASE + url, { headers: tier ? { "x-test-tier": tier } : {} });
  return { status: res.status, body: await res.text(), cache: res.headers.get("cache-control") ?? "" };
}

const rank = (t: Tier) => TIERS.indexOf(t);

function expectation(model: ModelName, tier: Tier): "full" | "preview" | "denied" {
  const entry = modelEntry(model);
  if (rank(tier) >= rank(entry.minimum_tier)) return "full";
  return entry.free_preview ? "preview" : "denied";
}

for (const model of MODEL_NAMES) {
  const m = markers.models[model];
  if (!m) continue;
  describe(model, () => {
    for (const tier of TIERS) {
      const mode = expectation(model, tier);
      test(`as ${tier}: ${mode}`, async () => {
        for (const api of MODEL_ROUTES[model].api) {
          const res = await get(api, tier);
          expect(res.cache).toContain("no-store");
          const recent = m.new.api;
          if (mode === "denied") {
            expect(res.status).toBe(403);
            for (const v of [...recent, ...m.old.api]) expect(res.body, `${api} leaked ${v}`).not.toContain(v);
          } else {
            expect(res.status).toBe(200);
            if (mode === "full") for (const v of recent) expect(res.body, `${api} is missing ${v}`).toContain(v);
            if (mode === "preview") {
              for (const v of [...recent, ...(m.mid?.api ?? [])]) expect(res.body, `${api} preview leaked ${v}`).not.toContain(v);
              for (const v of m.old.api) expect(res.body, `${api} preview is missing ${v}`).toContain(v);
            }
          }
        }
        for (const page of MODEL_ROUTES[model].pages) {
          const res = await get(page, tier);
          expect(res.status).toBe(200);
          expect(res.cache).not.toContain("public");
          if (mode === "full") for (const v of m.new.page) expect(res.body, `${page} is missing ${v}`).toContain(v);
          if (mode !== "full") {
            for (const v of [...m.new.page, ...m.new.api, ...(m.mid?.page ?? []), ...(m.mid?.api ?? [])]) {
              expect(res.body, `${page} leaked ${v}`).not.toContain(v);
            }
          }
          if (mode === "preview") for (const v of m.old.page) expect(res.body, `${page} preview is missing ${v}`).toContain(v);
          if (mode === "denied") {
            for (const v of [...m.old.page, ...m.old.api]) expect(res.body, `${page} leaked ${v}`).not.toContain(v);
            expect(res.body).toContain(`data-locked="${model}"`);
          }
        }
      });
    }
  });
}

describe("everyone", () => {
  for (const tier of [null, ...TIERS] as (Tier | null)[]) {
    test(`reference versions and unpublished outputs are never shown (${tier ?? "anonymous"})`, async () => {
      const urls = [...ALL_PAGES, ...DETAIL, ...Object.values(MODEL_ROUTES).flatMap((r) => r.api)];
      for (const url of urls) {
        const res = await get(url, tier);
        for (const v of markers.never) expect(res.body, `${url} shows ${v}`).not.toContain(v);
      }
    });
  }

  test("every model, page and route is in the suite", () => {
    expect(Object.keys(markers.models).sort()).toEqual([...MODEL_NAMES].sort());
    for (const model of MODEL_NAMES) expect(Object.keys(markers.email), `${model} has no e-mail marker`).toContain(model);
    expect(ALL_PAGES).toContain("/email/crypto");
  });

  test("asking for a date cannot get past a preview's delay", async () => {
    for (const day of [markers.new, markers.mid, "2099-12-31"]) {
      for (const api of MODEL_ROUTES.crypto_cycle.api) {
        const res = await get(`${api}?date=${day}`, "free");
        const hidden = [...markers.models.crypto_cycle.new.api, ...(markers.models.crypto_cycle.mid?.api ?? [])];
        for (const v of hidden) expect(res.body, `${api}?date=${day} leaked ${v}`).not.toContain(v);
      }
    }
    const boundary = await get(`/api/v1/crypto/cycle?date=${markers.old}`, "free");
    for (const v of markers.models.crypto_cycle.old.api) expect(boundary.body).toContain(v);   // the last allowed day
  });

  // Runs for every model whose config/entitlements.yaml entry has a recent window (none today; the unit tests cover
  // the rule itself). The seed then lists the values older than the window under recent_window.<model>.
  test("a recent window hides older history from the tiers below its full-history tier", async () => {
    for (const model of MODEL_NAMES) {
      const entry = modelEntry(model);
      if (!entry.recent_window) continue;
      const m = markers.recent_window[model];
      expect(m, `the seed has no recent-window markers for ${model}`).toBeDefined();
      const full = entry.recent_window.full_history_tier;
      for (const tier of TIERS) {
        if (rank(tier) < rank(entry.minimum_tier)) continue;
        const api = await get(`${MODEL_ROUTES[model].api[0]}?date=${m.before}`, tier);
        for (const v of m.api) {
          if (rank(tier) >= rank(full)) expect(api.body, `${model} as ${tier} is missing ${v}`).toContain(v);
          else expect(api.body, `${model} as ${tier} leaked ${v}`).not.toContain(v);
        }
      }
    }
  });

  test("the weekly e-mail carries each tier's numbers only to that tier and above, with no delayed preview", async () => {
    for (const tier of TIERS) {
      const page = await get("/email/crypto", tier);
      expect(page.status).toBe(200);
      expect(page.cache).not.toContain("public");
      for (const [model, values] of Object.entries(markers.email)) {
        const full = expectation(model as ModelName, tier) === "full";
        for (const v of full ? values.slice(0, 1) : values) {
          if (full) expect(page.body, `/email/crypto as ${tier} is missing ${model} ${v}`).toContain(v);
          else expect(page.body, `/email/crypto as ${tier} leaked ${model} ${v}`).not.toContain(v);
        }
        for (const v of values.slice(1)) expect(page.body, `/email/crypto as ${tier} shows an old ${model} value ${v}`).not.toContain(v);
      }
    }
  });

  test("bitcoin's own page shows each part of its analysis only to the tiers that include it", async () => {
    for (const tier of TIERS) {
      const page = await get("/crypto/btc", tier);
      expect(page.status).toBe(200);
      for (const [model, m] of Object.entries(markers.crypto_page)) {
        const mode = expectation(model as ModelName, tier);
        if (mode === "full") {
          for (const v of m.new) expect(page.body, `/crypto/btc as ${tier} is missing ${model} ${v}`).toContain(v);
        } else {
          for (const v of [...m.new, ...(m.mid ?? [])]) expect(page.body, `/crypto/btc as ${tier} leaked ${model} ${v}`).not.toContain(v);
          if (mode === "preview") for (const v of m.old) expect(page.body, `/crypto/btc preview is missing ${v}`).toContain(v);
          if (mode === "denied") {
            for (const v of m.old) expect(page.body, `/crypto/btc as ${tier} leaked ${model} ${v}`).not.toContain(v);
            expect(page.body).toContain(`data-locked="${model}"`);
          }
        }
      }
    }
  });

  test("asking the crypto routes for a date cannot get past the cycle preview's delay", async () => {
    const hidden = [...markers.models.crypto_cycle.new.api, ...(markers.models.crypto_cycle.mid?.api ?? [])];
    for (const day of [markers.new, "2099-12-31"]) {
      const res = await get(`/api/v1/crypto/cycle?pair=btcusd&date=${day}`, "free");
      for (const v of hidden) expect(res.body, `cycle?date=${day} leaked ${v}`).not.toContain(v);
    }
    expect((await get("/api/v1/crypto/cycle?pair=nope", "free")).status).toBe(404);
  });

  test("detail pages render for a free visitor, and a malformed address is a 404, not an error", async () => {
    for (const url of DETAIL) expect((await get(url, "free")).status).toBe(200);
    // (An address with a broken %-sequence is refused by Next.js's own router with a bare 500 before any of our code
    // runs; it carries no data or detail, so it is not checked here.)
    for (const url of ["/methods/constructor", "/crypto/nope", "/crypto/constructor", "/email/nope", "/api/v1/crypto/cycle?pair=nope"]) {
      expect((await get(url, "free")).status, url).toBe(404);
    }
    expect((await get("/api/v1/crypto/cycle?date=2026-02-30", "free")).status).toBe(400);
  });

  test("an anonymous visitor is treated as free", async () => {
    const anonymous = await get("/api/v1/models", null);
    expect(JSON.parse(anonymous.body).viewer_tier).toBe("free");
    const bands = await get("/api/v1/crypto/trend-bands", null);
    expect(bands.status).toBe(modelEntry("crypto_trend_bands").minimum_tier === "free" ? 200 : 403);
  });

  test("a made-up tier is ignored", async () => {
    const res = await get("/api/v1/models", "superuser" as Tier);
    expect(JSON.parse(res.body).viewer_tier).toBe("free");
  });
});

describe("build output", () => {
  const next = path.join(__dirname, "..", "..", ".next");

  test("the browser bundle holds no server code, settings or queries", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(js|css|json|html)$/.test(e.name)) files.push(p);
      }
    };
    walk(path.join(next, "static"));
    expect(files.length).toBeGreaterThan(0);
    const forbidden = ["DATABASE_URL", "ALLOW_TEST_TIERS", "x-test-tier", "method_version = $1", "postgres://", "postgresql://", "web_reader"];
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      for (const s of forbidden) expect(text.includes(s), `${path.relative(next, f)} contains ${s}`).toBe(false);
    }
  });

  test("no page that shows model data is built ahead of time", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(next, "prerender-manifest.json"), "utf8"));
    const prerendered = Object.keys(manifest.routes ?? {}).filter((r) => r !== "/_not-found" && r !== "/_global-error");
    expect(prerendered).toEqual([]);
  });
});
