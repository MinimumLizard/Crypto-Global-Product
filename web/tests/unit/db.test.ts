import { describe, expect, test } from "vitest";

import { buildQuery, dateColumn, poolConfig } from "@/lib/db";
import { type Granted, authorize } from "@/lib/entitlements";
import { MODEL_NAMES, modelEntry, registry } from "@/lib/registry";

import { withRecentWindow } from "./with-window";

const TODAY = "2026-10-12";
const version = modelEntry("crypto_cycle").current_version;
const full = authorize({ id: null, tier: "professional" }, "crypto_cycle", TODAY) as Granted;
const preview = authorize({ id: null, tier: "free" }, "crypto_cycle", TODAY) as Granted;

describe("buildQuery", () => {
  test("always filters to the granted version", () => {
    const q = buildQuery(full, "models.crypto_cycle_daily", { where: "day = ?", params: ["2026-10-09"], orderBy: "pair" });
    expect(q.text).toBe("select * from models.crypto_cycle_daily where method_version = $1 and (day = $2) order by pair");
    expect(q.values).toEqual([version, "2026-10-09"]);
  });

  test("a preview can never read past its date", () => {
    expect(preview.maxDate).toBe("2026-10-05");
    const q = buildQuery(preview, "models.crypto_cycle_daily", { where: "day = ?", params: ["2026-10-09"] });
    expect(q.text).toContain("day <= $2");
    expect(q.values).toEqual([version, "2026-10-05", "2026-10-09"]);
  });

  test("a recent window can never read before its first day", () => {
    withRecentWindow("crypto_market", { days: 30, full_history_tier: "plus" }, () => {
      const recent = authorize({ id: null, tier: "free" }, "crypto_market", TODAY) as Granted;
      const q = buildQuery(recent, "models.crypto_market_daily", { where: "pair = ?", params: ["btcusd"] });
      expect(q.text).toContain("day >= $2");
      expect(q.values).toEqual([modelEntry("crypto_market").current_version, "2026-09-12", "btcusd"]);
      const plus = authorize({ id: null, tier: "plus" }, "crypto_market", TODAY) as Granted;
      expect(buildQuery(plus, "models.crypto_market_daily").text).not.toContain(">=");
    });
  });

  test("a grant cannot be made up: only authorize() issues them", () => {
    const forged = { allowed: true, model: "crypto_trend_bands", version: "1.0.0", maxDate: null, delayDays: 0, minDate: null, fullHistoryTier: null } as Granted;
    expect(() => buildQuery(forged, "models.crypto_trend_band")).toThrow(/not a grant/);
    expect(() => buildQuery({ ...full }, "models.crypto_cycle_daily")).toThrow(/not a grant/);
    expect(Object.isFrozen(full)).toBe(true);
  });

  test("a model can read only its own outputs, never an unpublished one", () => {
    expect(() => buildQuery(full, "models.crypto_trend_band")).toThrow(/not an output/);
    expect(() => buildQuery(full, "models.model_stats")).toThrow(/not published|not an output/);
    const market = authorize({ id: null, tier: "free" }, "crypto_market", TODAY) as Granted;
    expect(() => buildQuery(market, "models.crypto_market_daily; drop table x")).toThrow();
  });

  test("an unpublished output is refused even when a model lists it", () => {
    const entry = registry.models.crypto_cycle;
    entry.outputs.push("models.model_stats");
    try {
      expect(() => buildQuery(full, "models.model_stats")).toThrow(/not published/);
    } finally {
      entry.outputs.pop();
    }
  });

  test("tables without dates are known, so they can never be served as a preview", () => {
    expect(dateColumn("models.no_such_table")).toBeNull();
    expect(dateColumn("models.crypto_market_daily")).toBe("day");
    expect(dateColumn("models.crypto_cycle_monthly")).toBe("day");
  });

  test("every output of a model with a preview or a recent window has a date to limit it by", () => {
    for (const name of MODEL_NAMES) {
      const entry = modelEntry(name);
      if (!entry.free_preview && !entry.recent_window) continue;
      for (const table of entry.outputs) {
        if (registry.unpublished_outputs.includes(table)) continue;
        expect(dateColumn(table), `${name}: ${table}`).not.toBeNull();
      }
    }
    const preview7 = authorize({ id: null, tier: "free" }, "crypto_cycle", TODAY) as Granted;
    expect(buildQuery(preview7, "models.crypto_cycle_anchor").text).toContain("day <= $2");
    expect(preview7.maxDate).toBe("2026-10-05");
  });

  test("every model output has a date column, so any model can be given a preview or a window", () => {
    for (const name of MODEL_NAMES) for (const table of modelEntry(name).outputs) expect(dateColumn(table), table).not.toBeNull();
  });

  test("identifiers and placeholders are checked", () => {
    expect(() => buildQuery(full, "models.crypto_cycle_daily", { columns: ["mayer; drop"] })).toThrow(/bad column/);
    expect(() => buildQuery(full, "models.crypto_cycle_daily", { orderBy: "pair; drop" })).toThrow(/bad order by/);
    expect(() => buildQuery(full, "models.crypto_cycle_daily", { where: "pair = ?", params: [] })).toThrow(/too few/);
    expect(() => buildQuery(full, "models.crypto_cycle_daily", { where: "pair = 'x'", params: [1] })).toThrow(/too many/);
  });
});

describe("connection settings", () => {
  const env = (extra: Record<string, string>) => ({ ...extra }) as unknown as NodeJS.ProcessEnv;

  test("a remote database is only used over verified TLS", () => {
    expect(() => poolConfig(env({ DATABASE_URL: "postgresql://web_reader.x@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" }))).toThrow(/DATABASE_CA_CERT/);
    const c = poolConfig(env({ DATABASE_URL: "postgresql://u@db.example:6543/postgres", DATABASE_CA_CERT: "PEM" }));
    expect(c.ssl).toEqual({ ca: "PEM", rejectUnauthorized: true });
  });

  test("timeouts and a small pool, so a database problem fails fast", () => {
    const c = poolConfig(env({ DATABASE_URL: "postgresql://web_reader@127.0.0.1:5432/x" }));
    expect(c.ssl).toBeUndefined();
    expect(c.max).toBe(3);
    expect(c.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(c.query_timeout).toBeGreaterThan(0);
  });
});
