import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Chart from "@/components/Chart";
import CryptoNotice from "@/components/CryptoNotice";
import Locked from "@/components/Locked";
import ModelFooter from "@/components/ModelFooter";
import PreviewNote from "@/components/PreviewNote";
import Sparkline from "@/components/Sparkline";
import Term from "@/components/Term";
import { lineOption, weeklyPoints } from "@/lib/charts";
import { CRYPTO_ASSETS, assetByPair, price } from "@/lib/crypto-display";
import { type MarketDay, cryptoCycle, cryptoHistory, cryptoOverview } from "@/lib/data/crypto";
import { NONE, date, pct, percent, ratio, tone } from "@/lib/format";
import { sessionsBehind } from "@/lib/freshness";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The front page, laid out as a terminal's "today" screen: a briefing written from the day's figures, every tracked
// asset in one table, bitcoin's history, and bitcoin's long averages (Charts tier, a week late for free visitors).
// Every sentence states a measured fact; none says what to do or what comes next (hard rule 3).
export default async function Home() {
  const [t, viewer] = await Promise.all([getTranslations(), getViewer()]);
  const [overview, btc, cycle] = await Promise.all([
    cryptoOverview(viewer),
    cryptoHistory(viewer, "btcusd"),
    cryptoCycle(viewer, "btcusd", { history: false }),
  ]);
  const order = (pair: string) => CRYPTO_ASSETS.findIndex((a) => a.pair === pair);
  const latest = [...(overview.data?.latest ?? [])].filter((r) => assetByPair(r.pair)).sort((a, b) => order(a.pair) - order(b.pair));
  const name = (pair: string) => t(`crypto.assets.${assetByPair(pair)!.slug}` as never);
  const day = overview.data?.day ?? null;
  const level = cycle.data?.daily[cycle.data.daily.length - 1];

  // The briefing: plain sentences built from the day's closes. Only facts about the past day; no reading of them.
  const usd = latest.filter((r) => assetByPair(r.pair)?.quote === "USD" && r.ret_1d != null);
  const largest = [...usd].sort((a, b) => Math.abs(b.ret_1d!) - Math.abs(a.ret_1d!))[0];
  const ethbtc = latest.find((r) => r.pair === "ethbtc");
  const assetLine = (r: MarketDay) =>
    t("home.briefAsset", {
      name: name(r.pair),
      price: price(r.close),
      change: pct(r.ret_1d),
      high: r.drawdown < 0 ? t("home.fromHigh", { pct: pct(r.drawdown) }) : t("home.atHigh"),
    });
  const brief = [
    ...latest.filter((r) => r.pair === "btcusd" || r.pair === "ethusd").map(assetLine),
    usd.length > 0
      ? t("home.briefBreadth", { up: usd.filter((r) => r.ret_1d! > 0).length, down: usd.filter((r) => r.ret_1d! < 0).length, total: usd.length })
      : null,
    largest ? t("home.briefLargest", { name: name(largest.pair), change: pct(largest.ret_1d) }) : null,
    ethbtc ? t("home.briefRatio", { ratio: price(ethbtc.close, "BTC"), change: pct(ethbtc.ret_30d) }) : null,
  ].filter((l): l is string => Boolean(l));

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{day ? t("home.eyebrowDay", { date: date(day) }) : t("home.eyebrow")}</div>
        <h1>{t("home.heroTitle")}</h1>
        {brief.length > 0 && (
          <ul>
            {brief.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        <p className="when">{t("home.heroSub")}</p>
      </section>

      <CryptoNotice />

      <section className="card">
        <div className="card-head">
          <h2>{t("home.marketsTitle")}</h2>
          <span className="head-tools">
            {day && <DateChip day={day} stale={sessionsBehind("crypto", day) > 0} label={t("home.close", { date: date(day) })} />}
            <Link className="more" href="/crypto">{t("home.more")} →</Link>
          </span>
        </div>
        {!overview.access.allowed ? (
          <Locked access={overview.access} />
        ) : latest.length === 0 ? (
          <p className="muted">{t("common.noData")}</p>
        ) : (
          <div className="table-wrap">
            <table className="markets">
              <thead>
                <tr>
                  <th>{t("crypto.asset")}</th>
                  <th className="num">{t("crypto.close")}</th>
                  <th className="num">{t("crypto.d1")}</th>
                  <th className="num">{t("crypto.d7")}</th>
                  <th className="num">{t("crypto.d30")}</th>
                  <th className="num">{t("crypto.y1")}</th>
                  <th className="num"><Term id="drawdown">{t("crypto.drawdown")}</Term></th>
                  <th className="num"><Term id="volatility">{t("crypto.vol30")}</Term></th>
                  <th className="spark-col">{t("home.trend90")}</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((r) => {
                  const asset = assetByPair(r.pair)!;
                  return (
                    <tr key={r.pair}>
                      <td>
                        <Link className="sym" href={`/crypto/${asset.slug}`}>{asset.label}</Link>
                        <span className="sub">{name(r.pair)}</span>
                      </td>
                      <td className="num">{price(r.close, asset.quote)}</td>
                      <td className={`num ${tone(r.ret_1d)}`}>{pct(r.ret_1d)}</td>
                      <td className={`num ${tone(r.ret_7d)}`}>{pct(r.ret_7d)}</td>
                      <td className={`num ${tone(r.ret_30d)}`}>{pct(r.ret_30d)}</td>
                      <td className={`num ${tone(r.ret_1y)}`}>{pct(r.ret_1y)}</td>
                      <td className="num">{pct(r.drawdown)}</td>
                      <td className="num">{percent(r.vol_30d == null ? null : r.vol_30d * 100, 0)}</td>
                      <td className="spark-col">
                        <Sparkline values={overview.data?.recent[r.pair] ?? []} label={`${name(r.pair)}, ${t("home.trend90")}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted panel-foot">{t("crypto.utcDay")}</p>
      </section>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="card-head">
            <h2>{t("home.btcChartTitle")}</h2>
            <Link className="more" href="/crypto/btc">{t("home.more")} →</Link>
          </div>
          {btc.access.allowed && btc.data && btc.data.length > 1 ? (
            <>
              <Chart label={t("home.btcChartTitle")}
                     option={lineOption([{ name: t("crypto.price"), points: weeklyPoints(btc.data, (r) => r.close) }], "USD", { logY: true })} />
              <p className="small muted panel-foot"><Term id="logScale" /> · <Term id="drawdown" /> · <Term id="volatility" /></p>
            </>
          ) : (
            <p className="muted">{t("common.noData")}</p>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>{t("home.levelsTitle")}</h2>
            <span className="head-tools">
              {cycle.access.allowed && cycle.data?.day && (
                <DateChip day={cycle.data.day} stale={Boolean(cycle.access.maxDate)} label={t("home.close", { date: date(cycle.data.day) })} />
              )}
              <span className="tier-pill plus">{t("tiers.plus")}</span>
            </span>
          </div>
          {!cycle.access.allowed ? (
            <Locked access={cycle.access} />
          ) : !level ? (
            <p className="muted">{t("common.noData")}</p>
          ) : (
            <>
              <PreviewNote access={cycle.access} />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th><Term id="movingAverage">{t("home.levelsMeasure")}</Term></th>
                      <th className="num">{t("home.levelsValue")}</th>
                      <th className="num">{t("home.levelsDistance")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      [t("cryptoAsset.sma50"), level.sma_50],
                      [t("cryptoAsset.sma200"), level.sma_200],
                      [t("cryptoAsset.sma20w"), level.sma_20w],
                      [t("cryptoAsset.ema21w"), level.ema_21w],
                      [t("crypto.sma200w"), level.sma_200w],
                    ] as const).map(([label, v]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td className="num">{price(v)}</td>
                        <td className={`num ${tone(v ? level.close / v - 1 : null)}`}>{v ? pct(level.close / v - 1) : NONE}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <Term id="mayer">{t("cryptoAsset.mayer")}</Term>
                        <span className="sub">{t("cryptoAsset.mayerNote")}</span>
                      </td>
                      <td className="num">{ratio(level.mayer)}</td>
                      <td className="num" />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="small muted panel-foot">
                {t("home.levelsNote", { price: price(level.close), date: date(level.day) })}
              </p>
            </>
          )}
        </section>
      </div>

      <div className="grid four" style={{ marginTop: 16, marginBottom: 16 }}>
        {([["1", "/learn#drawdown"], ["2", "/learn#movingAverage"], ["3", "/methods"]] as const).map(([n, href]) => (
          <Link key={n} href={href} className="card link-card">
            <span className="kicker">{t(`home.learn${n}Kicker`)}</span>
            <strong>{t(`home.learn${n}Title`)}</strong>
            <span className="muted small">{t(`home.learn${n}Body`)}</span>
          </Link>
        ))}
        <Link href="/plans" className="card link-card">
          <span className="kicker">{t("home.plansTitle")}</span>
          <strong>{t("home.plansCard")}</strong>
          <span className="muted small">{t("home.plansBody")}</span>
        </Link>
      </div>

      <ModelFooter models={["crypto_market", "crypto_cycle"]} shownAbove={["crypto_risk"]} />
    </>
  );
}

// The day a panel's figures are for, with a dot that turns amber when they are behind the calendar or delayed.
function DateChip({ day, stale, label }: { day: string; stale: boolean; label: string }) {
  return <time className={`panel-date${stale ? " stale" : ""}`} dateTime={day}>{label}</time>;
}
