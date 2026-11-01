// Cycle comparisons: each cycle's path drawn from the same starting line, so cycles can be laid over one another.
// Pure arithmetic on model outputs that were already read through the tier check: closes (crypto_market) and the
// halvings, cycle peaks and lows as known on the latest day (crypto_cycle). x is days since the cycle's anchor, y is
// the close divided by the anchor's close (1 = the anchor's price).

export interface Close { day: string; close: number }
export interface Anchor { kind: string; epoch: number; anchor_day: string; anchor_close: number; provisional?: boolean }
export interface Path { epoch: number; anchorDay: string; provisional: boolean; points: [number, number][] }

const DAY_MS = 86_400_000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/** One path per anchor of `kind`, each running until the next anchor of the same kind (or the last close), thinned
 * to every `step`-th day (always keeping a path's last point). */
export function cyclePaths(closes: Close[], anchors: Anchor[], kind: string, step = 3): Path[] {
  const own = anchors.filter((a) => a.kind === kind).sort((a, b) => a.anchor_day.localeCompare(b.anchor_day));
  return own.map((a, i) => {
    const end = own[i + 1]?.anchor_day;
    const inside = closes.filter((c) => c.day >= a.anchor_day && (!end || c.day <= end));
    const points: [number, number][] = [];
    inside.forEach((c, j) => {
      if (j % step === 0 || j === inside.length - 1) points.push([daysBetween(a.anchor_day, c.day), Number((c.close / a.anchor_close).toPrecision(5))]);
    });
    return { epoch: a.epoch, anchorDay: a.anchor_day, provisional: Boolean(a.provisional), points };
  }).filter((p) => p.points.length > 1);
}

/** Average return of each calendar month across the completed months given: [month 1..12] -> {mean, median,
 * positive share, count}. */
export function seasonality(months: { month: string; ret_month: number | null }[]) {
  const by: number[][] = Array.from({ length: 12 }, () => []);
  for (const m of months) if (m.ret_month != null) by[Number(m.month.slice(5, 7)) - 1].push(m.ret_month);
  return by.map((v) => {
    if (!v.length) return { mean: null, median: null, positive: null, count: 0 };
    const sorted = [...v].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return {
      mean: v.reduce((s, x) => s + x, 0) / v.length,
      median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
      positive: v.filter((x) => x > 0).length / v.length,
      count: v.length,
    };
  });
}

/** Quarterly returns as a year x quarter grid, from rows dated on each quarter's last day. */
export function quarterGrid(points: [string, number][]): { year: number; q: (number | null)[] }[] {
  const years = new Map<number, (number | null)[]>();
  for (const [day, v] of points) {
    const y = Number(day.slice(0, 4));
    const q = Math.floor((Number(day.slice(5, 7)) - 1) / 3);
    if (!years.has(y)) years.set(y, [null, null, null, null]);
    years.get(y)![q] = v;
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0]).map(([year, q]) => ({ year, q }));
}

/** Monthly returns as a year x month grid (undefined: no such month in the data), latest year first. */
export function monthGrid(months: { month: string; ret_month: number | null }[]): { year: number; cells: (number | null | undefined)[] }[] {
  const byYear = new Map<number, (number | null | undefined)[]>();
  for (const m of months) {
    const [y, mo] = m.month.split("-").map(Number);
    if (!byYear.has(y)) byYear.set(y, Array(12).fill(undefined));
    byYear.get(y)![mo - 1] = m.ret_month;
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, cells]) => ({ year, cells }));
}
