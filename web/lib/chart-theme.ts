// The site's colours applied to a chart option, so charts follow the light and dark themes. Pure: the Chart
// component reads the palette from the page's CSS tokens and calls this; so does the static preview's script.
export interface Palette {
  text: string;
  muted: string;
  border: string;
  surface: string;
  series: string[];
}

type Obj = Record<string, unknown>;

function axis(a: unknown, p: Palette): unknown {
  if (Array.isArray(a)) return a.map((x) => axis(x, p));
  const o = (a ?? {}) as Obj;
  return {
    ...o,
    axisLine: { lineStyle: { color: p.border }, ...(o.axisLine as Obj) },
    axisTick: { lineStyle: { color: p.border }, ...(o.axisTick as Obj) },
    axisLabel: { color: p.muted, ...(o.axisLabel as Obj) },
    nameTextStyle: { color: p.muted, ...(o.nameTextStyle as Obj) },
    splitLine: { lineStyle: { color: p.border, opacity: 0.7 }, ...(o.splitLine as Obj) },
  };
}

export function themed(option: Obj, p: Palette): Obj {
  return {
    ...option,
    color: p.series,
    textStyle: { color: p.text, fontFamily: "inherit" },
    legend: option.legend ? { ...(option.legend as Obj), textStyle: { color: p.muted }, pageTextStyle: { color: p.muted } } : undefined,
    tooltip: option.tooltip ? { backgroundColor: p.surface, borderColor: p.border, textStyle: { color: p.text }, ...(option.tooltip as Obj) } : undefined,
    xAxis: axis(option.xAxis, p),
    yAxis: axis(option.yAxis, p),
  };
}

/** The palette from CSS custom properties (in the browser), with the site's values as a fallback. */
export function paletteFrom(get: (name: string) => string): Palette {
  const v = (name: string, fallback: string) => get(name).replace(/^\s+|\s+$/g, "") || fallback;
  return {
    text: v("--text", "#0f1f3a"),
    muted: v("--muted", "#56637b"),
    border: v("--border", "#dde4ef"),
    surface: v("--surface", "#ffffff"),
    series: [v("--accent", "#1d5fd6"), v("--plus", "#0e7490"), v("--series-3", "#d97706"), v("--down", "#c2412d"), v("--up", "#12805c")],
  };
}
