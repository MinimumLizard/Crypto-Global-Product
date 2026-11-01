// ECharts option builders. Plain data only (no functions), so options can be built on the server and handed to the
// client Chart component after the tier check.

// The legend stays on one line above the plot (scrolling sideways on a phone), and the plot starts below both the
// legend and the y-axis name, so neither ever covers the data.
const LEGEND = { type: "scroll", top: 0 };
const TOP_WITH_LEGEND = 56;

export interface LineSeries {
  name: string;
  points: [string, number | null][];
  dashed?: boolean; // a reference line (an average, a band) drawn thinner and dashed
  faint?: boolean; // a band edge: thin and pale
}

export function lineOption(series: LineSeries[], yName?: string, opts: { area?: boolean; zeroLine?: boolean; logY?: boolean; percentY?: boolean; refLines?: number[]; min?: number; max?: number } = {}) {
  return {
    animation: false,
    tooltip: { trigger: "axis" },
    legend: series.length > 1 ? LEGEND : undefined,
    grid: { left: 52, right: 16, top: series.length > 1 ? TOP_WITH_LEGEND : yName ? 32 : 16, bottom: 32 },
    xAxis: { type: "time" },
    yAxis: opts.logY ? { type: "log", name: yName } : { type: "value", scale: true, name: yName, min: opts.min, max: opts.max, ...(opts.percentY ? { axisLabel: { formatter: "{value}%" } } : {}) },
    series: series.map((s, i) => ({
      name: s.name, type: "line", showSymbol: false, data: s.points,
      lineStyle: { width: s.faint ? 1 : s.dashed ? 1.5 : 2, ...(s.dashed ? { type: "dashed" } : {}), ...(s.faint ? { opacity: 0.6 } : {}) },
      // a soft fill under a single price line; a zero line where the series is a difference
      ...(opts.area && i === 0 && series.length === 1 ? { areaStyle: { opacity: 0.12 } } : {}),
      ...((opts.zeroLine || opts.refLines) && i === 0
        ? { markLine: { silent: true, symbol: "none", label: { show: false }, lineStyle: { type: "dotted" }, data: [...(opts.zeroLine ? [0] : []), ...(opts.refLines ?? [])].map((y) => ({ yAxis: y })) } }
        : {}),
    })),
  };
}

/** Six significant digits: enough for a chart, and it keeps the page small. */
export function sig(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Number(v.toPrecision(6)) : null;
}

/** A long daily history thinned for a chart: Sundays (UTC) only, every k-th one so that at most `maxPoints` remain
 * (counted back from the latest), plus the latest day itself. Keeps a phone's page small. */
export function weeklyPoints<T extends { day: string }>(rows: T[], value: (r: T) => number | null | undefined, maxPoints = 400): [string, number | null][] {
  const sundays = rows.filter((r, i) => i < rows.length - 1 && new Date(`${r.day}T00:00:00Z`).getUTCDay() === 0);
  const step = Math.max(1, Math.ceil(sundays.length / maxPoints));
  const kept = sundays.filter((_, i) => (sundays.length - 1 - i) % step === 0);
  if (rows.length) kept.push(rows[rows.length - 1]);
  return kept.map((r) => [r.day, sig(value(r))]);
}

/** Paths laid over one another: x is a number of days, y a multiple of the starting value (log scale). */
export function overlayOption(paths: { name: string; points: [number, number][]; dashed?: boolean }[], xName: string, yName: string) {
  return {
    animation: false,
    tooltip: { trigger: "axis" },
    legend: LEGEND,
    grid: { left: 52, right: 16, top: TOP_WITH_LEGEND, bottom: 40 },
    xAxis: { type: "value", name: xName, nameLocation: "middle", nameGap: 26, min: 0 },
    yAxis: { type: "log", name: yName },
    series: paths.map((p) => ({
      name: p.name, type: "line", showSymbol: false, data: p.points,
      lineStyle: { width: p.dashed ? 1.5 : 2, ...(p.dashed ? { type: "dashed" } : {}) },
    })),
  };
}

/** Bars, one per category (e.g. a calendar month), coloured by sign. Values in percent. */
export function barOption(categories: string[], values: (number | null)[], yName: string) {
  return {
    animation: false,
    tooltip: { trigger: "axis" },
    grid: { left: 52, right: 16, top: 32, bottom: 32 },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value", name: yName, axisLabel: { formatter: "{value}%" } },
    series: [{
      type: "bar",
      data: values.map((v) => (v == null ? null : { value: sig(v), itemStyle: { color: v >= 0 ? "#12805c" : "#c2412d" } })),
    }],
  };
}

/** Daily points of a [day, value] list, from a given day on (oscillators read best day by day over a recent span). */
export function dailyFrom(points: [string, number][], from: string): [string, number | null][] {
  return points.filter(([d]) => d >= from).map(([d, v]) => [d, sig(v)]);
}

/** A long [day, value] list thinned as weeklyPoints thins rows. */
export function weekly(points: [string, number][], maxPoints = 400): [string, number | null][] {
  return weeklyPoints(points.map(([day, v]) => ({ day, v })), (r) => r.v, maxPoints);
}
