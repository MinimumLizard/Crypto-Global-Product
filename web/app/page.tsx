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
import { date, pct, percent, tone } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The lessons the front page walks a beginner through, in order (Learn page anchors; text in messages).
const PATH = ["drawdown", "volatility", "movingAverage", "logScale", "halving", "marketCap"] as const;

// The front page, written for everyday investors: what the site is, the day in a few plain sentences, today's
// prices, one chart explained, bitcoin's long averages (Charts tier; free visitors see them a week late) and a path
// of short lessons. Every sentence states a measured fact or explains a term; none says what to do or what comes
// next (hard rule 3).
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
  const btcDay = latest.find((r) => r.pair === "btcusd");
  const level = cycle.data?.daily[cycle.data.daily.length - 1];
  const below = (fraction: number) => percent(Math.abs(fraction) * 100, 1);

  // The day in plain sentences: closes, the change on the day and the distance from the highest close.
  const usd = latest.filter((r) => assetByPair(r.pair)?.quote === "USD" && r.ret_1d != null);
  const sentence = (r: MarketDay) => {
    const facts = { name: name(r.pair), price: price(r.close), change: pct(r.ret_1d) };
    return r.drawdown < 0 ? t("home.briefAsset", { ...facts, below: below(r.drawdown) }) : t("home.briefAssetHigh", facts);
  };
  const brief = [
    ...latest.filter((r) => r.pair === "btcusd" || r.pair === "ethusd").map(sentence),
    usd.length > 0 ? t("home.briefBreadth", { up: usd.filter((r) => r.ret_1d! > 0).length, total: usd.length }) : null,
  ].filter((l): l is string => Boolean(l));

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">{t("home.eyebrow")}</div>
          <h1>{t("home.heroTitle")}</h1>
          <p className="lead">{t("home.heroSub")}</p>
          <div className="actions">
            <Link className="button" href="#lessons">{t("home.ctaLearn")}</Link>
            <Link className="button secondary" href="/crypto">{t("home.ctaPrices")}</Link>
          </div>
        </div>
        {brief.length > 0 && day && (
          <aside className="today" aria-labelledby="today-title">
            <h2 id="today-title">{t("home.todayTitle")}</h2>
            <p className="when">{t("home.todayWhen", { date: date(day) })}</p>
            <ul>
              {brief.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <Link href="/learn#drawdown" className="small">{t("home.todayLearn")} →</Link>
          </aside>
        )}
      </section>

      <CryptoNotice />

      <div className="section-head">
        <h2>{t("home.pricesTitle")}</h2>
        <Link className="more" href="/crypto">{t("home.pricesMore")} →</Link>
      </div>
      <p className="section-sub">{t("home.pricesSub")}</p>
      {!overview.access.allowed ? (
        <Locked access={overview.access} />
      ) : latest.length === 0 ? (
        <p className="muted">{t("common.noData")}</p>
      ) : (
        <div className="table-wrap">
          <table className="markets">
            <thead>
              <tr>
                <th>{t("home.coin")}</th>
                <th className="num">{t("home.price")}</th>
                <th className="num">{t("crypto.d1")}</th>
                <th className="num hide-sm">{t("crypto.y1")}</th>
                <th className="num hide-sm"><Term id="drawdown">{t("home.belowHigh")}</Term></th>
                <th className="spark-col">{t("home.trend90")}</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => {
                const asset = assetByPair(r.pair)!;
                return (
                  <tr key={r.pair}>
                    <td>
                      <Link className="sym" href={`/crypto/${asset.slug}`}>{name(r.pair)}</Link>
                      <span className="sub">{asset.label}</span>
                    </td>
                    <td className="num">{price(r.close, asset.quote)}</td>
                    <td className={`num ${tone(r.ret_1d)}`}>{pct(r.ret_1d)}</td>
                    <td className={`num hide-sm ${tone(r.ret_1y)}`}>{pct(r.ret_1y)}</td>
                    <td className="num hide-sm">{r.drawdown < 0 ? below(r.drawdown) : t("home.atHighShort")}</td>
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

      <div className="grid two" style={{ marginTop: 40 }}>
        <section className="card">
          <div className="card-head">
            <h2>{t("home.chartTitle")}</h2>
            <Link className="more" href="/crypto/btc">{t("home.chartMore")} →</Link>
          </div>
          {btc.access.allowed && btc.data && btc.data.length > 1 ? (
            <Chart label={t("home.chartTitle")}
                   option={lineOption([{ name: t("crypto.price"), points: weeklyPoints(btc.data, (r) => r.close) }], "USD", { logY: true })} />
          ) : (
            <p className="muted">{t("common.noData")}</p>
          )}
          <div className="explain">
            <span className="label">{t("home.explainLabel")}</span>
            <p>{t("home.chartExplain")}</p>
            {btcDay && btcDay.drawdown < 0 && (
              <p>{t("home.chartDrawdown", { below: below(btcDay.drawdown), high: price(btcDay.ath_close), date: date(btcDay.ath_day) })}</p>
            )}
            <p><Link href="/learn#logScale">{t("home.chartLearn")} →</Link></p>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>{t("home.averagesTitle")}</h2>
            <span className="tier-pill plus">{t("tiers.plus")}</span>
          </div>
          <p className="muted">{t("home.averagesIntro")}</p>
          {!cycle.access.allowed ? (
            <Locked access={cycle.access} />
          ) : !level ? (
            <p className="muted">{t("common.noData")}</p>
          ) : (
            <>
              <PreviewNote access={cycle.access} />
              <ul className="facts-list">
                {([
                  ["sma50", level.sma_50],
                  ["sma200", level.sma_200],
                  ["sma200w", level.sma_200w],
                ] as const).map(([key, v]) => {
                  const gap = v ? level.close / v - 1 : null;
                  return (
                    <li key={key}>
                      <span className="what">
                        {t(`home.avg.${key}`)} <small>{t(`home.avg.${key}Note`)}</small>
                      </span>
                      <span className="figure">{price(v)}</span>
                      {gap != null && (
                        <span className="muted small">
                          {gap >= 0 ? t("home.avgAbove", { pct: below(gap) }) : t("home.avgBelow", { pct: below(gap) })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="explain">
                <span className="label">{t("home.explainLabel")}</span>
                <p>{t("home.averagesExplain", { date: date(level.day), price: price(level.close) })}</p>
                <p><Link href="/learn#movingAverage">{t("home.averagesLearn")} →</Link></p>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="section-head" id="lessons">
        <h2>{t("home.pathTitle")}</h2>
        <Link className="more" href="/learn">{t("home.pathAll")} →</Link>
      </div>
      <p className="section-sub">{t("home.pathSub")}</p>
      <ol className="steps">
        {PATH.map((id) => (
          <li key={id}>
            <Link href={`/learn#${id}`}>
              <strong>{t(`home.lesson.${id}.title`)}</strong>
              <span>{t(`home.lesson.${id}.body`)}</span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="coming">
        <span className="tag">{t("home.labTag")}</span>
        <h3>{t("home.labTitle")}</h3>
        <p>{t("home.labBody")}</p>
      </div>

      <div className="section-head">
        <h2>{t("home.principlesTitle")}</h2>
      </div>
      <ul className="principles">
        {(["facts", "methods", "sources"] as const).map((k) => (
          <li key={k} className="card">
            <strong>{t(`home.principles.${k}.title`)}</strong>
            <span>{t(`home.principles.${k}.body`)}</span>
          </li>
        ))}
      </ul>

      <section className="card" style={{ marginTop: 40, marginBottom: 24 }}>
        <div className="card-head">
          <h2>{t("home.plansTitle")}</h2>
          <Link className="more" href="/plans">{t("home.plansLink")} →</Link>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>{t("home.plansBody")}</p>
      </section>

      <ModelFooter models={["crypto_market", "crypto_cycle"]} shownAbove={["crypto_risk"]} />
    </>
  );
}
