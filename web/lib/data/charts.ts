// The chart library's price lines (model crypto_charts), read through the one tier check like everything else.
import "server-only";

import type { Viewer } from "../entitlements";
import { readOutput } from "../db";
import { type Result, cappedDate, withModel } from "./common";

export type Points = [string, number][];

/** Some of one pair's lines: their whole history (or from `from` on), as [day, value] points in date order. */
export async function chartLines(viewer: Viewer, pair: string, series: string[], opts: { from?: string } = {}): Promise<Result<{
  day: string | null; lines: Record<string, Points>;
}>> {
  return withModel(viewer, "crypto_charts", async (g) => {
    const where = ["pair = ?", "series = any(?)"];
    const params: unknown[] = [pair, series];
    if (opts.from) { where.push("day >= ?"); params.push(opts.from); }
    const rows = await readOutput<{ series: string; day: string; value: number }>(g, "models.crypto_charts_series", {
      columns: ["series", "day", "value"], where: where.join(" and "), params, orderBy: "series, day",
    });
    const lines: Record<string, Points> = {};
    let day: string | null = null;
    for (const r of rows) {
      (lines[r.series] ??= []).push([r.day, r.value]);
      if (!day || r.day > day) day = r.day;
    }
    return { day, lines };
  });
}

/** Every line's value on one pair's latest day (or the latest on or before `date`). */
export async function chartLatest(viewer: Viewer, pair: string, date?: string): Promise<Result<{ day: string | null; values: Record<string, number> }>> {
  return withModel(viewer, "crypto_charts", async (g) => {
    const capped = cappedDate(g, date);
    const last = await readOutput<{ day: string }>(g, "models.crypto_charts_series", {
      columns: ["day"], where: capped ? "pair = ? and day <= ?" : "pair = ?", params: capped ? [pair, capped] : [pair],
      orderBy: "day desc", limit: 1,
    });
    const day = last[0]?.day ?? null;
    if (!day) return { day: null, values: {} };
    const rows = await readOutput<{ series: string; value: number }>(g, "models.crypto_charts_series", {
      columns: ["series", "value"], where: "pair = ? and day = ?", params: [pair, day], orderBy: "series",
    });
    return { day, values: Object.fromEntries(rows.map((r) => [r.series, r.value])) };
  });
}

/** Some of the Bitcoin network's daily series (model btc_network), whole history, as [day, value] points. */
export async function networkLines(viewer: Viewer, series: string[]): Promise<Result<{ day: string | null; lines: Record<string, Points> }>> {
  return withModel(viewer, "btc_network", async (g) => {
    const rows = await readOutput<{ series: string; day: string; value: number }>(g, "models.btc_network_series", {
      columns: ["series", "day", "value"], where: "series = any(?)", params: [series], orderBy: "series, day",
    });
    const lines: Record<string, Points> = {};
    let day: string | null = null;
    for (const r of rows) {
      (lines[r.series] ??= []).push([r.day, r.value]);
      if (!day || r.day > day) day = r.day;
    }
    return { day, lines };
  });
}

/** Every network series on the latest published day (or the latest on or before `date`). */
export async function networkLatest(viewer: Viewer, date?: string): Promise<Result<{ day: string | null; values: Record<string, number> }>> {
  return withModel(viewer, "btc_network", async (g) => {
    const capped = cappedDate(g, date);
    const last = await readOutput<{ day: string }>(g, "models.btc_network_series", {
      columns: ["day"], where: capped ? "day <= ?" : undefined, params: capped ? [capped] : [], orderBy: "day desc", limit: 1,
    });
    const day = last[0]?.day ?? null;
    if (!day) return { day: null, values: {} };
    const rows = await readOutput<{ series: string; value: number }>(g, "models.btc_network_series", {
      columns: ["series", "value"], where: "day = ?", params: [day], orderBy: "series",
    });
    return { day, values: Object.fromEntries(rows.map((r) => [r.series, r.value])) };
  });
}
