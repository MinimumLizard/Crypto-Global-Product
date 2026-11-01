import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CATEGORIES, CHARTS, DATA_COST, chartTier, isLive } from "@/lib/chart-catalogue";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("charts.title") };
}

// The chart library: every chart, live or planned, by category, with its plan and the kind of data it needs (and
// whether that data is free to show or needs a licence). No data is read here.
export default async function ChartsPage() {
  const t = await getTranslations();
  const live = CHARTS.filter(isLive).length;
  return (
    <>
      <h1>{t("charts.title")}</h1>
      <p className="lead">{t("charts.intro", { live, planned: CHARTS.length - live })}</p>
      <ul className="data-legend">
        {(["free", "licence", "paid"] as const).map((k) => (
          <li key={k}><span className={`data-badge ${k}`}>{t(`charts.cost.${k}`)}</span> {t(`charts.cost.${k}Note`)}</li>
        ))}
      </ul>
      {CATEGORIES.map((cat) => {
        const items = CHARTS.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat}>
            <div className="section-head"><h2>{t(`charts.categories.${cat}.title`)}</h2></div>
            <p className="section-sub">{t(`charts.categories.${cat}.intro`)}</p>
            <div className="chart-cards">
              {items.map((c) => {
                const tier = chartTier(c);
                return (
                  <Link key={c.slug} href={`/charts/${c.slug}`} className={`card chart-card${isLive(c) ? "" : " planned"}`}>
                    <span className="card-tags">
                      {tier ? <span className={`tier-pill ${tier}`}>{t(`tiers.${tier}`)}</span> : <span className="tier-pill planned">{t("charts.planned")}</span>}
                      <span className={`data-badge ${DATA_COST[c.data]}`}>{t(`charts.data.${c.data}.short`)}</span>
                    </span>
                    <strong>{t(`charts.items.${c.slug}.title` as never)}</strong>
                    <span className="muted small">{t(`charts.items.${c.slug}.summary` as never)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
