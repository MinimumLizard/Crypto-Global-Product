import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { assetByPair, price } from "@/lib/crypto-display";
import type { MarketDay } from "@/lib/data/crypto";
import { pct, tone } from "@/lib/format";

// The day's largest rises and falls among the coins we follow (US-dollar pairs), and the week's.
export default async function Movers({ rows }: { rows: MarketDay[] }) {
  const t = await getTranslations();
  const usd = rows.filter((r) => assetByPair(r.pair)?.quote === "USD");
  const by = (key: "ret_1d" | "ret_7d", dir: 1 | -1) =>
    usd.filter((r) => r[key] != null && dir * r[key]! > 0).sort((a, b) => dir * (b[key]! - a[key]!)).slice(0, 3);
  const card = (title: string, list: MarketDay[], key: "ret_1d" | "ret_7d") => (
    <section className="card movers">
      <h2>{title}</h2>
      {list.length === 0 ? <p className="muted small">{t("markets.none")}</p> : (
        <ul>
          {list.map((r) => {
            const a = assetByPair(r.pair)!;
            return (
              <li key={r.pair}>
                <Link href={`/crypto/${a.slug}`}>{t(`crypto.assets.${a.slug}` as never)}</Link>
                <span className="num">{price(r.close)}</span>
                <span className={`chip ${tone(r[key])}`}>{pct(r[key])}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
  return (
    <div className="grid four movers-grid">
      {card(t("markets.gainers1d"), by("ret_1d", 1), "ret_1d")}
      {card(t("markets.losers1d"), by("ret_1d", -1), "ret_1d")}
      {card(t("markets.gainers7d"), by("ret_7d", 1), "ret_7d")}
      {card(t("markets.losers7d"), by("ret_7d", -1), "ret_7d")}
    </div>
  );
}
