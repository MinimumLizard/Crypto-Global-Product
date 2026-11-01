// The body of each live chart in the library: its chart(s) and its latest readings. Every number is read through
// the one tier check (lib/data/*), and a part the visitor's plan does not include shows <Locked>, never its data.
import { getTranslations } from "next-intl/server";

import Chart from "@/components/Chart";
import Locked from "@/components/Locked";
import PreviewNote from "@/components/PreviewNote";
import { barOption, dailyFrom, lineOption, overlayOption, sig, weekly, weeklyPoints } from "@/lib/charts";
import { CRYPTO_ASSETS, price } from "@/lib/crypto-display";
import { chartLines, networkLines } from "@/lib/data/charts";
import { cryptoCycle, cryptoHistory, cryptoTrend } from "@/lib/data/crypto";
import type { Access, Viewer } from "@/lib/entitlements";
import { NONE, date, int, num, pct, percent, ratio, tone } from "@/lib/format";
import { cyclePaths, monthGrid, quarterGrid, seasonality } from "@/lib/overlays";
import { addDays, todayUTC } from "@/lib/time";

type T = Awaited<ReturnType<typeof getTranslations>>;
export interface Ctx { t: T; viewer: Viewer; pair: string; name: string }
type Reading = [string, string];

const MULTIPLES = [1.6, 2, 3, 5, 8, 13, 21];
const scale = (points: [string, number][], k: number): [string, number][] => points.map(([d, v]) => [d, v * k]);
const percentOf = (points: [string, number | null][]): [string, number | null][] => points.map(([d, v]) => [d, v == null ? null : sig(v * 100)]);
const annual = (v: number | null | undefined) => percent(v == null ? null : v * 100, 0);
const last = (points: [string, number][] | undefined) => (points && points.length ? points[points.length - 1][1] : null);

async function Readings({ day, rows }: { t?: T; day: string | null; rows: Reading[] }) {
  if (!rows.length) return null;
  const t = await getTranslations();
  return (
    <section className="card readings">
      <h2>{t("charts.page.latest")}</h2>
      {day && <p className="asof">{t("common.asOf", { date: date(day) })}</p>}
      <dl className="facts">
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function denied(...accesses: Access[]) {
  const d = accesses.find((a) => !a.allowed);
  return d && !d.allowed ? <Locked access={d} /> : null;
}

function Heat({ t, head, rows }: { t: T; head: string[]; rows: { year: number; cells: (number | null | undefined)[] }[] }) {
  return (
    <div className="table-wrap">
      <table className="heat">
        <thead>
          <tr>
            <th>{t("cryptoAsset.year")}</th>
            {head.map((h) => <th key={h} className="num">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ year, cells }) => (
            <tr key={year}>
              <td>{year}</td>
              {cells.map((v, i) => (
                <td key={i} className="num">{v == null ? "" : <span className={`chip ${tone(v)}`}>{pct(v, Math.abs(v) < 0.005 ? 1 : 0)}</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function chartBody(slug: string, ctx: Ctx): Promise<React.ReactNode> {
  const { viewer, pair } = ctx;
  const t = await getTranslations();
  const L = (k: string) => t(`charts.lines.${k}` as never);
  const recent = addDays(todayUTC(), -730);

  switch (slug) {
    case "multiplier-bands":
    case "two-year-multiplier": {
      const golden = slug === "multiplier-bands";
      const key = golden ? "sma_350" : "sma_730";
      const [hist, lines] = await Promise.all([cryptoHistory(viewer, pair), chartLines(viewer, pair, [key])]);
      const lock = denied(hist.access, lines.access);
      if (lock) return lock;
      const avg = lines.data!.lines[key] ?? [];
      const close = hist.data!.at(-1)?.close ?? null;
      const a = last(avg);
      const multiples = golden ? MULTIPLES : [5];
      return (
        <>
          <Chart label={t(`charts.items.${slug}.title` as never)} height={420} option={lineOption([
            { name: t("crypto.price"), points: weeklyPoints(hist.data!, (r) => r.close) },
            { name: L(key), points: weekly(avg) },
            ...multiples.map((k) => ({ name: `${L(key)} × ${k}`, points: weekly(scale(avg, k)), faint: true })),
          ], "USD", { logY: true })} />
          <Readings t={t} day={lines.data!.day} rows={[
            [L(key), price(a)],
            ...multiples.map((k): Reading => [`${L(key)} × ${k}`, price(a == null ? null : a * k)]),
            [t("charts.page.priceOverAverage"), a && close ? ratio(close / a) : NONE],
          ]} />
        </>
      );
    }

    case "long-averages":
    case "weekly-band":
    case "pi-cycle": {
      const cycle = await cryptoCycle(viewer, pair);
      if (!cycle.access.allowed) return <Locked access={cycle.access} />;
      const d = cycle.data!.daily;
      const l = d.at(-1);
      const sets = {
        "long-averages": [["sma_50", (r: typeof d[0]) => r.sma_50], ["sma_200", (r: typeof d[0]) => r.sma_200], ["sma_200w", (r: typeof d[0]) => r.sma_200w]],
        "weekly-band": [["sma_20w", (r: typeof d[0]) => r.sma_20w], ["ema_21w", (r: typeof d[0]) => r.ema_21w]],
        "pi-cycle": [["pi_sma_111", (r: typeof d[0]) => r.pi_sma_111], ["pi_sma_350x2", (r: typeof d[0]) => r.pi_sma_350x2],
                     ["pi_ema_150", (r: typeof d[0]) => r.pi_ema_150], ["pi_sma_471x0745", (r: typeof d[0]) => r.pi_sma_471x0745]],
      } as const;
      const set = sets[slug];
      const extra: Reading[] = slug === "long-averages" && l ? [[t("cryptoAsset.mayer"), ratio(l.mayer)]]
        : slug === "weekly-band" && l ? [[t("cryptoAsset.dist20w"), pct(l.dist_20w)]] : [];
      return (
        <>
          <PreviewNote access={cycle.access} />
          <Chart label={t(`charts.items.${slug}.title` as never)} height={420} option={lineOption([
            { name: t("crypto.price"), points: weeklyPoints(d, (r) => r.close) },
            ...set.map(([k, f], i) => ({ name: L(k), points: weeklyPoints(d, f), dashed: i % 2 === 1 })),
          ], "USD", { logY: true })} />
          {slug === "pi-cycle" && cycle.data!.events.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead><tr><th>{t("cryptoAsset.date")}</th><th>{t("cryptoAsset.event")}</th><th className="num">{t("cryptoAsset.closeAt")}</th></tr></thead>
                <tbody>
                  {cycle.data!.events.map((e) => (
                    <tr key={`${e.kind}${e.day}`}>
                      <td>{date(e.day)}</td>
                      <td>{t(e.kind === "pi_top_cross" ? "cryptoAsset.crossTop" : "cryptoAsset.crossBottom")}</td>
                      <td className="num">{price(e.close)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Readings t={t} day={l?.day ?? null} rows={[
            ...set.map(([k, f]): Reading => [L(k), price(l ? f(l) : null)]), ...extra,
          ]} />
        </>
      );
    }

    case "trend-bands": {
      const trend = await cryptoTrend(viewer, "btcusd");
      if (!trend.access.allowed) return <Locked access={trend.access} />;
      const rows = trend.data!.rows;
      return (
        <>
          <PreviewNote access={trend.access} />
          {(["power_law", "log_regression"] as const).map((fit) => {
            const r = rows.filter((x) => x.fit === fit);
            return (
              <section key={fit} style={{ marginBottom: 24 }}>
                <h2>{t(`cryptoAsset.fit_${fit}`)}</h2>
                <Chart label={t(`cryptoAsset.fit_${fit}`)} height={380} option={lineOption([
                  { name: t("crypto.price"), points: weeklyPoints(r, (x) => x.close) },
                  { name: L("fitted"), points: weeklyPoints(r, (x) => x.fitted), dashed: true },
                  { name: L("band_1"), points: weeklyPoints(r, (x) => x.upper_1), faint: true },
                  { name: L("band_1_low"), points: weeklyPoints(r, (x) => x.lower_1), faint: true },
                  { name: L("band_2"), points: weeklyPoints(r, (x) => x.upper_2), faint: true },
                  { name: L("band_2_low"), points: weeklyPoints(r, (x) => x.lower_2), faint: true },
                ], "USD", { logY: true })} />
                <Readings t={t} day={r.at(-1)?.day ?? null} rows={[[L("fitted"), price(r.at(-1)?.fitted)], [L("band_2"), price(r.at(-1)?.upper_2)], [L("band_2_low"), price(r.at(-1)?.lower_2)]]} />
              </section>
            );
          })}
        </>
      );
    }

    case "running-returns": {
      const [hist, lines] = await Promise.all([cryptoHistory(viewer, pair), chartLines(viewer, pair, ["roi_730d", "roi_1460d"])]);
      const lock = denied(hist.access, lines.access);
      if (lock) return lock;
      const ln = lines.data!.lines;
      return (
        <>
          <Chart label={t("charts.items.running-returns.title")} height={400} option={lineOption([
            { name: L("roi_365d"), points: percentOf(weeklyPoints(hist.data!, (r) => r.ret_1y)) },
            { name: L("roi_730d"), points: percentOf(weekly(ln.roi_730d ?? [])) },
            { name: L("roi_1460d"), points: percentOf(weekly(ln.roi_1460d ?? [])) },
          ], "%", { zeroLine: true, percentY: true })} />
          <Readings t={t} day={lines.data!.day} rows={[
            [L("roi_365d"), pct(hist.data!.at(-1)?.ret_1y)], [L("roi_730d"), pct(last(ln.roi_730d))], [L("roi_1460d"), pct(last(ln.roi_1460d))],
          ]} />
        </>
      );
    }

    case "year-to-date": {
      const lines = await chartLines(viewer, pair, ["ret_ytd"], { from: addDays(todayUTC(), -3 * 365) });
      if (!lines.access.allowed) return <Locked access={lines.access} />;
      const p = lines.data!.lines.ret_ytd ?? [];
      return (
        <>
          <Chart label={t("charts.items.year-to-date.title")} option={lineOption([{ name: L("ret_ytd"), points: percentOf(dailyFrom(p, "0000")) }], "%", { zeroLine: true, percentY: true })} />
          <Readings t={t} day={lines.data!.day} rows={[[L("ret_ytd"), pct(last(p))]]} />
        </>
      );
    }

    case "monthly-returns":
    case "seasonality": {
      const cycle = await cryptoCycle(viewer, pair);
      if (!cycle.access.allowed) return <Locked access={cycle.access} />;
      const months = cycle.data!.months;
      const names = t.raw("cryptoAsset.months") as string[];
      if (slug === "monthly-returns") {
        return (<><PreviewNote access={cycle.access} /><Heat t={t} head={names} rows={monthGrid(months)} /></>);
      }
      const s = seasonality(months);
      return (
        <>
          <PreviewNote access={cycle.access} />
          <Chart label={t("charts.items.seasonality.title")} option={barOption(names, s.map((m) => (m.mean == null ? null : m.mean * 100)), "%")} />
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead><tr><th>{t("charts.page.month")}</th><th className="num">{t("charts.page.mean")}</th><th className="num">{t("charts.page.median")}</th><th className="num">{t("charts.page.positive")}</th><th className="num">{t("charts.page.years")}</th></tr></thead>
              <tbody>
                {s.map((m, i) => (
                  <tr key={names[i]}>
                    <td>{names[i]}</td>
                    <td className={`num ${tone(m.mean)}`}>{pct(m.mean, 1)}</td>
                    <td className={`num ${tone(m.median)}`}>{pct(m.median, 1)}</td>
                    <td className="num">{m.positive == null ? NONE : `${Math.round(m.positive * 100)}%`}</td>
                    <td className="num">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    case "quarterly-returns": {
      const lines = await chartLines(viewer, pair, ["ret_quarter"]);
      if (!lines.access.allowed) return <Locked access={lines.access} />;
      const grid = quarterGrid(lines.data!.lines.ret_quarter ?? []);
      return <Heat t={t} head={["Q1", "Q2", "Q3", "Q4"]} rows={grid.map((g) => ({ year: g.year, cells: g.q }))} />;
    }

    case "since-first-close": {
      const usd = CRYPTO_ASSETS.filter((a) => a.quote === "USD");
      const all = await Promise.all(usd.map((a) => cryptoHistory(viewer, a.pair)));
      const lock = denied(...all.map((h) => h.access));
      if (lock) return lock;
      const series = usd.map((a, i) => {
        const h = all[i].data!;
        const first = h[0]?.close;
        return { name: t(`crypto.assets.${a.slug}` as never), rows: h, first };
      }).filter((s) => s.first);
      return (
        <>
          <Chart label={t("charts.items.since-first-close.title")} height={440} option={lineOption(
            series.map((s) => ({ name: s.name, points: weeklyPoints(s.rows, (r) => r.close / s.first!) })), "×", { logY: true },
          )} />
          <Readings t={t} day={series[0]?.rows.at(-1)?.day ?? null} rows={series.map((s): Reading => [
            `${s.name} (${date(s.rows[0].day)})`, ratio((s.rows.at(-1)?.close ?? NaN) / s.first!),
          ])} />
        </>
      );
    }

    case "after-halving":
    case "after-cycle-low":
    case "after-cycle-peak": {
      const kind = slug === "after-halving" ? "halving" : slug === "after-cycle-low" ? "cycle_low" : "cycle_peak";
      const [hist, cycle] = await Promise.all([cryptoHistory(viewer, pair), cryptoCycle(viewer, pair, { history: false })]);
      const lock = denied(hist.access, cycle.access);
      if (lock) return lock;
      const paths = cyclePaths(hist.data!.map((r) => ({ day: r.day, close: r.close })), cycle.data!.anchors, kind);
      if (!paths.length) return <p className="muted">{t("charts.page.noCycles")}</p>;
      const label = (p: (typeof paths)[number]) => t(`charts.page.path_${kind}`, { n: p.epoch, date: date(p.anchorDay) });
      const now = paths.at(-1)!;
      const nowPoint = now.points.at(-1)!;
      return (
        <>
          {cycle.access.allowed && <PreviewNote access={cycle.access} />}
          <Chart label={t(`charts.items.${slug}.title` as never)} height={440} option={overlayOption(
            paths.map((p, i) => ({ name: label(p), points: p.points, dashed: i === paths.length - 1 && p.provisional })),
            t("charts.page.daysSince"), "×",
          )} />
          <Readings t={t} day={hist.data!.at(-1)?.day ?? null} rows={[
            [t("charts.page.latestPath"), label(now)],
            [t("charts.page.daysSince"), int(nowPoint[0])],
            [t("charts.page.multiple"), ratio(nowPoint[1])],
            ...paths.slice(0, -1).map((p): Reading => [label(p), t("charts.page.sameDay", { value: ratio(p.points.find((x) => x[0] >= nowPoint[0])?.[1] ?? null) })]),
          ]} />
        </>
      );
    }

    case "rsi": {
      const lines = await chartLines(viewer, pair, ["rsi_14d", "rsi_14w"]);
      if (!lines.access.allowed) return <Locked access={lines.access} />;
      const ln = lines.data!.lines;
      return (
        <>
          <h2>{L("rsi_14w")}</h2>
          <Chart label={L("rsi_14w")} option={lineOption([{ name: L("rsi_14w"), points: weekly(ln.rsi_14w ?? []) }], undefined, { refLines: [30, 70], min: 0, max: 100 })} />
          <h2>{L("rsi_14d")}</h2>
          <Chart label={L("rsi_14d")} option={lineOption([{ name: L("rsi_14d"), points: dailyFrom(ln.rsi_14d ?? [], recent) }], undefined, { refLines: [30, 70], min: 0, max: 100 })} />
          <Readings t={t} day={lines.data!.day} rows={[[L("rsi_14d"), num(last(ln.rsi_14d), 1)], [L("rsi_14w"), num(last(ln.rsi_14w), 1)]]} />
        </>
      );
    }

    case "macd": {
      const lines = await chartLines(viewer, pair, ["macd", "macd_signal", "macd_hist"], { from: recent });
      if (!lines.access.allowed) return <Locked access={lines.access} />;
      const ln = lines.data!.lines;
      return (
        <>
          <Chart label={t("charts.items.macd.title")} option={lineOption([
            { name: L("macd"), points: dailyFrom(ln.macd ?? [], recent) },
            { name: L("macd_signal"), points: dailyFrom(ln.macd_signal ?? [], recent), dashed: true },
            { name: L("macd_hist"), points: dailyFrom(ln.macd_hist ?? [], recent), faint: true },
          ], "USD", { zeroLine: true })} />
          <Readings t={t} day={lines.data!.day} rows={[[L("macd"), num(last(ln.macd), 2)], [L("macd_signal"), num(last(ln.macd_signal), 2)], [L("macd_hist"), num(last(ln.macd_hist), 2)]]} />
        </>
      );
    }

    case "bollinger": {
      const [hist, lines] = await Promise.all([cryptoHistory(viewer, pair), chartLines(viewer, pair, ["bb_mid", "bb_upper", "bb_lower", "bb_width"])]);
      const lock = denied(hist.access, lines.access);
      if (lock) return lock;
      const ln = lines.data!.lines;
      return (
        <>
          <Chart label={t("charts.items.bollinger.title")} height={400} option={lineOption([
            { name: t("crypto.price"), points: hist.data!.filter((r) => r.day >= recent).map((r) => [r.day, sig(r.close)]) },
            { name: L("bb_mid"), points: dailyFrom(ln.bb_mid ?? [], recent), dashed: true },
            { name: L("bb_upper"), points: dailyFrom(ln.bb_upper ?? [], recent), faint: true },
            { name: L("bb_lower"), points: dailyFrom(ln.bb_lower ?? [], recent), faint: true },
          ], "USD")} />
          <h2>{L("bb_width")}</h2>
          <Chart label={L("bb_width")} option={lineOption([{ name: L("bb_width"), points: weekly(ln.bb_width ?? []) }])} />
          <Readings t={t} day={lines.data!.day} rows={[[L("bb_upper"), price(last(ln.bb_upper))], [L("bb_mid"), price(last(ln.bb_mid))], [L("bb_lower"), price(last(ln.bb_lower))], [L("bb_width"), num(last(ln.bb_width), 3)]]} />
        </>
      );
    }

    case "volatility": {
      const [hist, lines] = await Promise.all([cryptoHistory(viewer, pair), chartLines(viewer, pair, ["vol_365d"])]);
      const lock = denied(hist.access, lines.access);
      if (lock) return lock;
      const v = lines.data!.lines.vol_365d ?? [];
      const h = hist.data!;
      return (
        <>
          <Chart label={t("charts.items.volatility.title")} height={400} option={lineOption([
            { name: L("vol_30d"), points: percentOf(weeklyPoints(h, (r) => r.vol_30d)), faint: true },
            { name: L("vol_90d"), points: percentOf(weeklyPoints(h, (r) => r.vol_90d)) },
            { name: L("vol_365d"), points: percentOf(weekly(v)), dashed: true },
          ], "%", { percentY: true })} />
          <Readings t={t} day={lines.data!.day} rows={[
            [L("vol_30d"), annual(h.at(-1)?.vol_30d)], [L("vol_90d"), annual(h.at(-1)?.vol_90d)], [L("vol_365d"), annual(last(v))],
          ]} />
        </>
      );
    }

    case "sharpe-sortino":
    case "correlation":
    case "beta":
    case "price-in-bitcoin": {
      const keys = { "sharpe-sortino": ["sharpe_365d", "sortino_365d"], correlation: ["corr_btc_90d"], beta: ["beta_btc_365d"], "price-in-bitcoin": ["price_btc"] }[slug]!;
      const lines = await chartLines(viewer, pair, keys);
      if (!lines.access.allowed) return <Locked access={lines.access} />;
      const ln = lines.data!.lines;
      const opts = slug === "correlation" ? { refLines: [0], min: -1, max: 1 } : slug === "beta" ? { refLines: [1] }
        : slug === "price-in-bitcoin" ? { logY: true } : { zeroLine: true };
      return (
        <>
          <Chart label={t(`charts.items.${slug}.title` as never)} height={400} option={lineOption(
            keys.map((k, i) => ({ name: L(k), points: weekly(ln[k] ?? []), dashed: i === 1 })), slug === "price-in-bitcoin" ? "BTC" : undefined, opts,
          )} />
          <Readings t={t} day={lines.data!.day} rows={keys.map((k): Reading => [L(k), slug === "price-in-bitcoin" ? price(last(ln[k]), "BTC") : num(last(ln[k]), 2)])} />
        </>
      );
    }

    case "supply-issuance":
    case "hash-rate":
    case "hash-ribbons":
    case "stock-to-flow":
    case "puell-multiple":
    case "halving-countdown": {
      const keys = {
        "supply-issuance": ["supply", "issuance", "inflation_365d"],
        "hash-rate": ["hash_rate_7d", "difficulty"],
        "hash-ribbons": ["hash_rate_30d", "hash_rate_60d"],
        "stock-to-flow": ["stock_to_flow"],
        "puell-multiple": ["puell"],
        "halving-countdown": ["blocks_to_halving", "days_to_halving", "issuance", "height"],
      }[slug]!;
      const net = await networkLines(viewer, keys);
      if (!net.access.allowed) return <Locked access={net.access} />;
      const ln = net.data!.lines;
      const day = net.data!.day;
      if (slug === "supply-issuance") {
        return (
          <>
            <Chart label={L("supply")} option={lineOption([{ name: L("supply"), points: weekly(ln.supply ?? []) }], "BTC", { area: true })} />
            <h2>{L("inflation_365d")}</h2>
            <Chart label={L("inflation_365d")} option={lineOption([{ name: L("inflation_365d"), points: percentOf(weekly(ln.inflation_365d ?? [])) }], "%", { logY: true })} />
            <Readings t={t} day={day} rows={[[L("supply"), int(last(ln.supply))], [L("issuance"), num(last(ln.issuance), 2)], [L("inflation_365d"), pct(last(ln.inflation_365d)).replace("+", "")]]} />
          </>
        );
      }
      if (slug === "halving-countdown") {
        const blocks = last(ln.blocks_to_halving);
        const days = last(ln.days_to_halving);
        const when = day && days != null ? addDays(day, Math.round(days)) : null;
        return (
          <>
            <h2>{L("issuance")}</h2>
            <Chart label={L("issuance")} option={lineOption([{ name: L("issuance"), points: weekly(ln.issuance ?? []) }], "BTC")} />
            <Readings t={t} day={day} rows={[[L("height"), int(last(ln.height))], [L("blocks_to_halving"), int(blocks)], [L("days_to_halving"), num(days, 0)], [L("halving_date"), when ? date(when) : NONE]]} />
          </>
        );
      }
      const logY = slug !== "puell-multiple";
      return (
        <>
          <Chart label={t(`charts.items.${slug}.title` as never)} height={400} option={lineOption(
            keys.map((k, i) => ({ name: L(k), points: weekly(ln[k] ?? []), dashed: i === 1 })), slug.startsWith("hash") ? "EH/s" : undefined,
            { logY, ...(slug === "puell-multiple" ? { refLines: [1] } : {}) },
          )} />
          <Readings t={t} day={day} rows={keys.map((k): Reading => [L(k), num(last(ln[k]), k === "difficulty" ? 0 : 2)])} />
        </>
      );
    }

    case "drawdown": {
      const hist = await cryptoHistory(viewer, pair);
      if (!hist.access.allowed) return <Locked access={hist.access} />;
      const h = hist.data!;
      const l = h.at(-1);
      return (
        <>
          <Chart label={t("charts.items.drawdown.title")} height={380} option={lineOption([{ name: L("drawdown"), points: percentOf(weeklyPoints(h, (r) => r.drawdown)) }], "%", { area: true, percentY: true })} />
          <Readings t={t} day={l?.day ?? null} rows={l ? [
            [L("drawdown"), pct(l.drawdown)], [t("cryptoAsset.high"), `${price(l.ath_close)} (${date(l.ath_day)})`], [t("charts.page.daysSinceHigh"), int(l.days_since_ath)],
          ] : []} />
        </>
      );
    }
  }
  return null;
}
