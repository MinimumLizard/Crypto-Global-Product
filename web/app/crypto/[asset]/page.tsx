import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import AsOf from "@/components/AsOf";
import Chart from "@/components/Chart";
import CryptoNotice from "@/components/CryptoNotice";
import Locked from "@/components/Locked";
import ModelFooter from "@/components/ModelFooter";
import PreviewNote from "@/components/PreviewNote";
import Sparkline from "@/components/Sparkline";
import StatTile from "@/components/StatTile";
import Term from "@/components/Term";
import { lineOption, sig, weeklyPoints } from "@/lib/charts";
import { assetBySlug, price } from "@/lib/crypto-display";
import { type CycleAnchor, type TrendDay, cryptoCycle, cryptoHistory, cryptoTrend } from "@/lib/data/crypto";
import { NONE, date, int, num, pct, percent, ratio, tone } from "@/lib/format";
import type { ModelName } from "@/lib/registry";
import { decodeSegment } from "@/lib/params";
import { monthGrid } from "@/lib/overlays";
import { CHARTS, chartTier, isLive } from "@/lib/chart-catalogue";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ asset: string }> }) {
  const asset = assetBySlug(decodeSegment((await params).asset));
  if (!asset) return {};
  const t = await getTranslations();
  return { title: t(`crypto.assets.${asset.slug}` as never) };
}

export default async function CryptoAssetPage({ params }: { params: Promise<{ asset: string }> }) {
  const asset = assetBySlug(decodeSegment((await params).asset));
  if (!asset) notFound();
  const [t, viewer] = await Promise.all([getTranslations(), getViewer()]);
  const isBtc = asset.pair === "btcusd";
  const [history, cycle, trend] = await Promise.all([
    cryptoHistory(viewer, asset.pair),
    asset.cycle ? cryptoCycle(viewer, asset.pair) : null,
    isBtc ? cryptoTrend(viewer, asset.pair) : null,
  ]);
  const name = t(`crypto.assets.${asset.slug}` as never);
  const rows = history.data ?? [];
  const last = rows[rows.length - 1];
  if (history.access.allowed && !last) notFound();
  const cyc = cycle?.access.allowed ? cycle.data : null;
  const daily = cyc?.daily ?? [];
  const lc = daily[daily.length - 1];
  const p = (v: number | null | undefined) => price(v, asset.quote);
  const year = rows.slice(-365);
  const low = rows.reduce((m, r) => (r.close < m.close ? r : m), rows[0] ?? { close: NaN, day: "" });
  const libCharts = CHARTS.filter((c) => isLive(c) && asset.quote === "USD"
    && (c.assets === "usd" || (c.assets === "alts" && asset.slug !== "btc") || (c.assets === "btc" && asset.slug === "btc")));
  const unit = asset.quote === "USD" ? "USD" : "BTC";
  const models: ModelName[] = ["crypto_market", ...(asset.cycle ? (["crypto_cycle"] as const) : []), ...(isBtc ? (["crypto_trend_bands"] as const) : [])];

  const anchorLabel = (a: CycleAnchor) => t(`cryptoAsset.kind_${a.kind}` as never, { n: a.epoch } as never);

  const trendChart = (fit: TrendDay["fit"]) => {
    const r = (trend?.data?.rows ?? []).filter((x) => x.fit === fit);
    return lineOption([
      { name: t("crypto.price"), points: weeklyPoints(r, (x) => x.close, 200) },
      { name: t("cryptoAsset.fitted"), points: weeklyPoints(r, (x) => x.fitted, 200), dashed: true },
      { name: `${t("cryptoAsset.inner")} (−)`, points: weeklyPoints(r, (x) => x.lower_1, 200), faint: true },
      { name: `${t("cryptoAsset.inner")} (+)`, points: weeklyPoints(r, (x) => x.upper_1, 200), faint: true },
      { name: `${t("cryptoAsset.outer")} (−)`, points: weeklyPoints(r, (x) => x.lower_2, 200), faint: true },
      { name: `${t("cryptoAsset.outer")} (+)`, points: weeklyPoints(r, (x) => x.upper_2, 200), faint: true },
    ], "USD", { logY: true });
  };

  return (
    <>
      <p className="small"><Link href="/crypto">← {t("crypto.title")}</Link></p>
      <div className="coin-head">
        <h1>{name} <span className="code">{asset.label}</span></h1>
        <button type="button" className="star big" data-star={asset.slug} aria-pressed="false" hidden data-needs-js=""
                data-label-on={t("coin.unwatch")} data-label-off={t("coin.watch")} aria-label={t("coin.watch")}>☆</button>
      </div>
      {last && <p className="lead">{t("cryptoAsset.pairLine", { pair: asset.label, date: date(rows[0].day) })}</p>}
      <CryptoNotice />
      {!history.access.allowed ? (
        <Locked access={history.access} />
      ) : (
        <>
          <div className="coin-price">
            <span className="big-price">{p(last.close)}</span>
            {([["d1", last.ret_1d], ["d7", last.ret_7d], ["d30", last.ret_30d], ["y1", last.ret_1y]] as const).map(([k, v]) => (
              <span key={k} className="chip-group"><span className="muted small">{t(`crypto.${k}`)}</span> <span className={`chip ${tone(v)}`}>{pct(v)}</span></span>
            ))}
          </div>
          <AsOf day={last.day} calendar="crypto" />
          <div className="grid two">
            <section className="card">
              <h2>{t("coin.keyStats")}</h2>
              <dl className="facts">
                <dt>{t("coin.ath")}</dt><dd>{p(last.ath_close)} · {date(last.ath_day)}</dd>
                <dt>{t("coin.atl")}</dt><dd>{p(low.close)} · {date(low.day)}</dd>
                <dt>{t("coin.daysSinceAth")}</dt><dd>{int(last.days_since_ath)}</dd>
                <dt><Term id="drawdown">{t("cryptoAsset.drawdown")}</Term></dt><dd>{pct(last.drawdown)}</dd>
                <dt><Term id="volatility">{t("cryptoAsset.vol30")}</Term></dt><dd>{percent(last.vol_30d == null ? null : last.vol_30d * 100, 0)} · {t("cryptoAsset.vol90")} {percent(last.vol_90d == null ? null : last.vol_90d * 100, 0)}</dd>
                <dt>{t("coin.firstClose")}</dt><dd>{p(rows[0].close)} · {date(rows[0].day)}</dd>
              </dl>
              {asset.slug === "eth" && <p className="small" style={{ marginTop: 8, marginBottom: 0 }}><Link href="/crypto/ethbtc">{t("cryptoAsset.ethbtc")} →</Link></p>}
            </section>
            <section className="card">
              {([["range52", year], ["rangeAll", rows]] as const).map(([k, span]) => {
                const lo = Math.min(...span.map((r) => r.close));
                const hi = Math.max(...span.map((r) => r.close));
                const at = hi > lo ? Math.round(((last.close - lo) / (hi - lo)) * 100) : 50;
                return (
                  <div key={k} className="range-block">
                    <h2>{t(`coin.${k}`)}</h2>
                    <div className="range" role="img" aria-label={`${t(`coin.${k}`)}: ${p(lo)} – ${p(hi)}`}>
                      <span className="range-mark" style={{ left: `${at}%` }} />
                    </div>
                    <div className="range-labels"><span>{t("coin.low")} {p(lo)}</span><span>{t("coin.high")} {p(hi)}</span></div>
                  </div>
                );
              })}
              <Sparkline values={rows.slice(-90).map((r) => r.close)} label={`${name}, ${t("crypto.last90")}`} />
              <span className="caption small muted">{t("crypto.last90")}</span>
            </section>
          </div>

          <h2><Term id="movingAverage">{daily.length ? t("cryptoAsset.priceChart") : t("cryptoAsset.priceOnly")}</Term></h2>
          {cycle?.access.allowed && <PreviewNote access={cycle.access} />}
          <Chart
            label={t("cryptoAsset.priceChart")}
            option={lineOption([
              { name: t("crypto.price"), points: weeklyPoints(rows, (r) => r.close) },
              ...(daily.length ? [
                { name: t("cryptoAsset.sma50"), points: weeklyPoints(daily, (r) => r.sma_50), dashed: true },
                { name: t("cryptoAsset.sma200"), points: weeklyPoints(daily, (r) => r.sma_200), dashed: true },
              ] : []),
            ], unit, { logY: true })}
          />
          <div className="grid two">
            <section className="card">
              <h3><Term id="drawdown">{t("cryptoAsset.drawdownChart")}</Term></h3>
              <Chart label={t("cryptoAsset.drawdownChart")} height={220}
                     option={lineOption([{ name: name, points: weeklyPoints(rows, (r) => r.drawdown * 100) }], "%", { area: true, percentY: true })} />
            </section>
            <section className="card">
              <h3><Term id="volatility">{t("cryptoAsset.volChart")}</Term></h3>
              <Chart label={t("cryptoAsset.volChart")} height={220}
                     option={lineOption([
                       { name: t("cryptoAsset.vol30"), points: weeklyPoints(rows, (r) => (r.vol_30d == null ? null : r.vol_30d * 100)) },
                       { name: t("cryptoAsset.vol90"), points: weeklyPoints(rows, (r) => (r.vol_90d == null ? null : r.vol_90d * 100)), dashed: true },
                     ], "%", { percentY: true })} />
            </section>
          </div>
        </>
      )}

      {cycle && (
        <>
          <div className="section-head">
            <h2>{t("cryptoAsset.cycleTitle")}</h2>
            <span className="tier-pill plus">{t("tiers.plus")}</span>
          </div>
          {!cycle.access.allowed ? (
            <Locked access={cycle.access} />
          ) : !lc ? (
            <p className="muted">{t("common.noData")}</p>
          ) : (
            <>
              <PreviewNote access={cycle.access} />
              <p className="asof">{t("common.asOf", { date: date(lc.day) })}</p>
              <div className="tiles">
                <StatTile label={t("cryptoAsset.mayer")} value={ratio(lc.mayer)} note={t("cryptoAsset.mayerNote")} />
                <StatTile label={t("crypto.sma200w")} value={p(lc.sma_200w)}
                          note={lc.sma_200w_chg_4w != null ? t("cryptoAsset.sma200wNote", { pct: pct(lc.sma_200w_chg_4w) }) : null} />
                <StatTile label={t("cryptoAsset.dist20w")} value={pct(lc.dist_20w)} note={`${t("cryptoAsset.sma20w")}: ${p(lc.sma_20w)}`} />
                <div className="tile stat">
                  <span className="label"><Term id="halving">{t("cryptoAsset.halving")}</Term></span>
                  <span className="value">{pct(lc.roi_since_halving)}</span>
                  <span className="sub">
                    {lc.last_halving ? t("cryptoAsset.halvingNote", { days: int(lc.days_since_halving), date: date(lc.last_halving) }) : NONE}
                  </span>
                </div>
              </div>

              <h3>{t("cryptoAsset.bandChart")}</h3>
              <Chart
                label={t("cryptoAsset.bandChart")}
                option={lineOption([
                  { name: t("crypto.price"), points: weeklyPoints(daily, (r) => r.close) },
                  { name: t("cryptoAsset.sma20w"), points: weeklyPoints(daily, (r) => r.sma_20w), dashed: true },
                  { name: t("cryptoAsset.ema21w"), points: weeklyPoints(daily, (r) => r.ema_21w), dashed: true },
                  { name: t("crypto.sma200w"), points: weeklyPoints(daily, (r) => r.sma_200w) },
                ], unit, { logY: true })}
              />

              <h3>{t("cryptoAsset.piChart")}</h3>
              <Chart
                label={t("cryptoAsset.piChart")}
                option={lineOption([
                  { name: t("crypto.price"), points: weeklyPoints(daily, (r) => r.close), faint: true },
                  { name: t("cryptoAsset.piTop"), points: weeklyPoints(daily, (r) => r.pi_sma_111) },
                  { name: t("cryptoAsset.piTop2"), points: weeklyPoints(daily, (r) => r.pi_sma_350x2) },
                  { name: t("cryptoAsset.piBottom"), points: weeklyPoints(daily, (r) => r.pi_ema_150), dashed: true },
                  { name: t("cryptoAsset.piBottom2"), points: weeklyPoints(daily, (r) => r.pi_sma_471x0745), dashed: true },
                ], unit, { logY: true })}
              />
              <h3>{t("cryptoAsset.crossings")}</h3>
              {(cyc?.events ?? []).length === 0 ? (
                <p className="muted">{t("cryptoAsset.crossingsNone")}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("cryptoAsset.date")}</th>
                        <th>{t("cryptoAsset.event")}</th>
                        <th className="num">{t("cryptoAsset.closeAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cyc?.events ?? []).map((e) => (
                        <tr key={`${e.kind}-${e.day}`}>
                          <td>{date(e.day)}</td>
                          <td>{e.kind === "pi_top_cross" ? t("cryptoAsset.crossTop") : t("cryptoAsset.crossBottom")}</td>
                          <td className="num">{p(e.close)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="small muted">{t("cryptoAsset.crossingsNote")}</p>

              <h3><Term id="halving">{t("cryptoAsset.cycleTable")}</Term></h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("cryptoAsset.event")}</th>
                      <th>{t("cryptoAsset.date")}</th>
                      <th className="num">{t("cryptoAsset.closeAt")}</th>
                      <th className="num">{t("cryptoAsset.fromPrior")}</th>
                      <th className="num">{t("cryptoAsset.daysFromPrior")}</th>
                      <th className="num">{t("cryptoAsset.since")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cyc?.anchors ?? []).map((a) => (
                      <tr key={`${a.kind}-${a.epoch}`}>
                        <td>
                          {anchorLabel(a)}
                          {a.provisional && <span className="sub">{t("cryptoAsset.provisional")}</span>}
                        </td>
                        <td>{date(a.anchor_day)}</td>
                        <td className="num">{p(a.anchor_close)}</td>
                        <td className={`num ${tone(a.change_from_prior)}`}>{pct(a.change_from_prior, 0)}</td>
                        <td className="num">{int(a.days_from_prior)}</td>
                        <td className={`num ${tone(a.roi)}`}>{pct(a.roi, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted">{t("cryptoAsset.cycleTableNote")}</p>

              <h3>{t("cryptoAsset.monthly")}</h3>
              <div className="table-wrap">
                <table className="heat">
                  <thead>
                    <tr>
                      <th>{t("cryptoAsset.year")}</th>
                      {(t.raw("cryptoAsset.months") as string[]).map((m) => <th key={m} className="num">{m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {monthGrid(cyc?.months ?? []).map(({ year, cells }) => (
                      <tr key={year}>
                        <td>{year}</td>
                        {cells.map((v, i) => (
                          <td key={i} className="num">{v === undefined ? "" : <span className={`chip ${tone(v)}`}>{pct(v, v != null && Math.abs(v) < 0.005 ? 1 : 0)}</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted">{t("cryptoAsset.monthlyNote", { pct: pct(lc.ret_mtd) })}</p>
            </>
          )}
        </>
      )}

      {trend && (
        <>
          <div className="section-head">
            <h2><Term id="powerLaw">{t("cryptoAsset.trendTitle")}</Term></h2>
            <span className="tier-pill pro">{t("tiers.pro")}</span>
          </div>
          {!trend.access.allowed ? (
            <Locked access={trend.access} />
          ) : !trend.data?.day ? (
            <p className="muted">{t("common.noData")}</p>
          ) : (
            <>
              <p className="small muted">{t("cryptoAsset.trendNote")}</p>
              <p className="asof">{t("common.asOf", { date: date(trend.data.day) })}</p>
              <div className="grid two">
                {(["power_law", "log_regression"] as const).map((fit) => {
                  const r = trend.data!.rows.filter((x) => x.fit === fit);
                  const lt = r[r.length - 1];
                  return (
                    <section key={fit} className="card">
                      <h3>{t(`cryptoAsset.fit_${fit}`)}</h3>
                      <p className="small muted">{t(`cryptoAsset.fit_${fit}_note`)}</p>
                      {lt && (
                        <>
                          <div className="stat" style={{ marginBottom: 8 }}>
                            <span className="label">{t("cryptoAsset.position")}</span>
                            <span className="value" data-position={fit}>{num(lt.position, 2)}</span>
                            <span className="sub">{t("cryptoAsset.positionNote")}</span>
                          </div>
                          <dl className="facts">
                            <dt>{t("cryptoAsset.fitted")}</dt>
                            <dd>{p(lt.fitted)}</dd>
                            <dt>{t("cryptoAsset.inner")}</dt>
                            <dd>{p(lt.lower_1)} – {p(lt.upper_1)}</dd>
                            <dt>{t("cryptoAsset.outer")}</dt>
                            <dd>{p(lt.lower_2)} – {p(lt.upper_2)}</dd>
                          </dl>
                          <p className="small muted" style={{ marginTop: 8 }}>
                            {t("cryptoAsset.coefficients", { date: date(lt.day), slope: num(sig(lt.slope), 3), n: int(lt.n_obs) })}
                          </p>
                        </>
                      )}
                      <Chart label={t(`cryptoAsset.fit_${fit}`)} height={260} option={trendChart(fit)} />
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
      {libCharts.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div className="section-head"><h2>{t("coin.chartsTitle", { name })}</h2></div>
          <p className="section-sub">{t("coin.chartsIntro", { name })}</p>
          <div className="chart-cards">
            {libCharts.map((c) => {
              const tier = chartTier(c);
              return (
                <Link key={c.slug} href={`/charts/${c.slug}?asset=${asset.slug}`} className="card chart-card">
                  <span className="card-tags">{tier && <span className={`tier-pill ${tier}`}>{t(`tiers.${tier}`)}</span>}</span>
                  <strong>{t(`charts.items.${c.slug}.title` as never)}</strong>
                  <span className="muted small">{t(`charts.items.${c.slug}.summary` as never)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <ModelFooter models={models} shownAbove={["crypto_risk"]} />
    </>
  );
}
