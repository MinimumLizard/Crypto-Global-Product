import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ModelFooter from "@/components/ModelFooter";
import { DATA_COST, chartBySlug, chartTier, isLive } from "@/lib/chart-catalogue";
import { CRYPTO_ASSETS, assetBySlug } from "@/lib/crypto-display";
import { decodeSegment } from "@/lib/params";
import { getViewer } from "@/lib/viewer";

import { chartBody } from "./bodies";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const spec = chartBySlug(decodeSegment((await params).slug));
  const t = await getTranslations();
  return { title: spec ? t(`charts.items.${spec.slug}.title` as never) : t("charts.title") };
}

// One chart of the library: the chart for the chosen coin, its latest readings, what it shows, how it is calculated,
// how to read it and its limits, and where its data comes from.
export default async function ChartPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spec = chartBySlug(decodeSegment((await params).slug));
  if (!spec) notFound();
  const [t, viewer, query] = await Promise.all([getTranslations(), getViewer(), searchParams]);
  const choices = spec.assets === "usd" ? CRYPTO_ASSETS.filter((a) => a.quote === "USD")
    : spec.assets === "alts" ? CRYPTO_ASSETS.filter((a) => a.quote === "USD" && a.slug !== "btc")
    : spec.assets === "btc" ? CRYPTO_ASSETS.filter((a) => a.slug === "btc") : [];
  const asked = typeof query.asset === "string" ? assetBySlug(query.asset) : undefined;
  const asset = choices.find((a) => a.slug === asked?.slug) ?? choices[0];
  const tier = chartTier(spec);
  const k = (part: string) => `charts.items.${spec.slug}.${part}` as never;
  const name = asset ? t(`crypto.assets.${asset.slug}` as never) : "";

  return (
    <>
      <p className="small"><Link href="/charts">← {t("charts.title")}</Link></p>
      <h1>{t(k("title"))}{asset && choices.length > 1 ? <span className="muted"> · {name}</span> : null}</h1>
      <p className="lead">{t(k("summary"))}</p>
      <p className="card-tags">
        {tier ? <span className={`tier-pill ${tier}`}>{t(`tiers.${tier}`)}</span> : <span className="tier-pill planned">{t("charts.planned")}</span>}
        <span className={`data-badge ${DATA_COST[spec.data]}`}>{t(`charts.data.${spec.data}.short`)}</span>
      </p>
      {choices.length > 1 && (
        <nav className="tabs" aria-label={t("charts.page.coin")}>
          {choices.map((a) => (
            <Link key={a.slug} href={`/charts/${spec.slug}?asset=${a.slug}`} aria-current={a.slug === asset?.slug ? "page" : undefined}>
              {a.label.replace("/USD", "")}
            </Link>
          ))}
        </nav>
      )}

      {isLive(spec) ? (
        <div className="chart-body">{await chartBody(spec.slug, { t, viewer, pair: asset?.pair ?? "btcusd", name })}</div>
      ) : (
        <div className="notice lock">{t("charts.page.plannedNote")}</div>
      )}

      <div className="grid three explain-grid">
        {(["what", "how", "read"] as const).map((part) => (
          <section key={part} className="card">
            <h2>{t(`charts.page.${part}`)}</h2>
            <p>{t(k(part))}</p>
          </section>
        ))}
      </div>
      <section className="explain" style={{ marginTop: 16 }}>
        <span className="label">{t("charts.page.data")}</span>
        <p>{t(`charts.data.${spec.data}.long`)}</p>
      </section>
      {isLive(spec) && <ModelFooter models={spec.models} />}
    </>
  );
}
