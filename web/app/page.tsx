import Link from "next/link";
import { getTranslations } from "next-intl/server";

import AsOf from "@/components/AsOf";
import Chart from "@/components/Chart";
import CryptoNotice from "@/components/CryptoNotice";
import Locked from "@/components/Locked";
import ModelFooter from "@/components/ModelFooter";
import StatTile from "@/components/StatTile";
import Term from "@/components/Term";
import { lineOption, weeklyPoints } from "@/lib/charts";
import { assetByPair, price } from "@/lib/crypto-display";
import { cryptoHistory, cryptoOverview } from "@/lib/data/crypto";
import { date, pct } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The free front page: bitcoin and ether from the free crypto_market model, bitcoin's whole history, and the way
// into Learn, Methods and Plans. Macro and global markets join here when they are built.
const HEADLINE = ["btcusd", "ethusd"] as const;

export default async function Home() {
  const [t, viewer] = await Promise.all([getTranslations(), getViewer()]);
  const [overview, btc] = await Promise.all([cryptoOverview(viewer), cryptoHistory(viewer, "btcusd")]);
  const latest = HEADLINE.map((pair) => overview.data?.latest.find((r) => r.pair === pair) ?? null);
  const name = (pair: string) => t(`crypto.assets.${assetByPair(pair)!.slug}` as never);

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t("home.eyebrow")}</div>
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroSub")}</p>
        {overview.data?.day && <p className="when">{t("home.when", { date: date(overview.data.day) })}</p>}
      </section>

      <CryptoNotice />

      <div className="section-head">
        <h2>{t("home.snapshot")}</h2>
        <Link className="more" href="/crypto">{t("home.more")} →</Link>
      </div>
      {!overview.access.allowed ? (
        <Locked access={overview.access} />
      ) : (
        <>
          <AsOf day={overview.data?.day ?? null} calendar="crypto" />
          <div className="tiles">
            {latest.map((r) => r && (
              <StatTile key={r.pair} label={name(r.pair)} value={price(r.close)} change={r.ret_1d}
                        note={r.drawdown < 0 ? t("home.fromHigh", { pct: pct(r.drawdown) }) : t("home.atHigh")}
                        spark={overview.data?.recent[r.pair] ?? []} sparkLabel={`${name(r.pair)}, ${t("home.trend90")}`}
                        sparkCaption={t("home.trend90")} />
            ))}
          </div>
        </>
      )}

      {btc.access.allowed && btc.data && btc.data.length > 1 && (
        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-head">
            <h2>{t("home.btcChartTitle")}</h2>
            <Link className="more" href="/crypto/btc">{t("home.more")} →</Link>
          </div>
          <Chart label={t("home.btcChartTitle")}
                 option={lineOption([{ name: t("crypto.price"), points: weeklyPoints(btc.data, (r) => r.close) }], "USD", { logY: true })} />
          <p className="small muted"><Term id="logScale" /> · <Term id="drawdown" /> · <Term id="volatility" /></p>
        </section>
      )}

      <div className="section-head">
        <h2>{t("home.learnTitle")}</h2>
        <Link className="more" href="/learn">{t("home.learnAll")} →</Link>
      </div>
      <div className="learn-cards">
        {([["1", "/learn#drawdown"], ["2", "/learn#movingAverage"], ["3", "/methods"]] as const).map(([n, href]) => (
          <Link key={n} href={href} className="card">
            <span className="kicker">{t(`home.learn${n}Kicker`)}</span>
            <strong className="display">{t(`home.learn${n}Title`)}</strong>
            <span className="muted small">{t(`home.learn${n}Body`)}</span>
          </Link>
        ))}
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-head">
          <h2>{t("home.plansTitle")}</h2>
          <Link className="more" href="/plans">{t("home.plansLink")} →</Link>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>{t("home.plansBody")}</p>
      </section>

      <ModelFooter models={["crypto_market"]} shownAbove={["crypto_risk"]} />
    </>
  );
}
