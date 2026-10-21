import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CRYPTO_ASSETS, assetByPair, price } from "@/lib/crypto-display";
import { cryptoOverview } from "@/lib/data/crypto";
import type { Viewer } from "@/lib/entitlements";
import { date, pct, tone } from "@/lib/format";

// The strip under the header: each tracked asset's latest close and its change on the day, from the free
// crypto_market model (read through the tier check like everything else). If the data cannot be read, the strip is
// left out rather than breaking the page.
export default async function Ticker({ viewer }: { viewer: Viewer }) {
  const t = await getTranslations();
  let overview: Awaited<ReturnType<typeof cryptoOverview>>;
  try {
    overview = await cryptoOverview(viewer);
  } catch {
    return null;
  }
  if (!overview.access.allowed || !overview.data?.day) return null;
  const order = (pair: string) => CRYPTO_ASSETS.findIndex((a) => a.pair === pair);
  const rows = overview.data.latest.filter((r) => assetByPair(r.pair)).sort((a, b) => order(a.pair) - order(b.pair));
  return (
    <div className="ticker" aria-label={t("ticker.label")}>
      <ul>
        <li className="asof-cell">
          <span className="sym">{t("ticker.close")}</span>
          <span className="px">{date(overview.data.day)}</span>
        </li>
        {rows.map((r) => {
          const asset = assetByPair(r.pair)!;
          return (
            <li key={r.pair}>
              <Link href={`/crypto/${asset.slug}`}>
                <span className="sym">{asset.quote === "USD" ? asset.label.replace("/USD", "") : asset.label}</span>
                <span className="px">
                  {price(r.close, asset.quote)}
                  <span className={tone(r.ret_1d)}>{pct(r.ret_1d)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
