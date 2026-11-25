import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Sparkline from "./Sparkline";
import Term from "./Term";
import { assetByPair, price } from "@/lib/crypto-display";
import type { MarketDay } from "@/lib/data/crypto";
import { pct, percent, tone } from "@/lib/format";

// The markets table, in the manner of a research terminal: every coin's latest close and its changes, sortable by any
// column, searchable, with a star to add a coin to the visitor's watchlist. All of it is rendered here; public/terminal.js
// only sorts, filters and stars (the search box, the stars and the watchlist switch appear once it runs).
export default async function CoinTable({ id, rows, recent }: { id: string; rows: MarketDay[]; recent: Record<string, number[]> }) {
  const t = await getTranslations();
  const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "");
  const cols = [
    ["price", t("markets.price")], ["d1", t("crypto.d1")], ["d7", t("crypto.d7")], ["d30", t("crypto.d30")],
    ["y1", t("crypto.y1")], ["dd", t("markets.fromHigh")], ["vol", t("markets.vol30")],
  ] as const;
  return (
    <>
      <div className="table-tools" data-needs-js hidden>
        <input type="search" data-filter={id} placeholder={t("markets.search")} aria-label={t("markets.search")} />
        <label><input type="checkbox" data-watch-only={id} /> {t("markets.watchOnly")}</label>
      </div>
      <div className="table-wrap">
        <table id={id} className="markets terminal" data-coins="">
          <thead>
            <tr>
              <th className="star-col"><span className="visually-hidden">{t("markets.watch")}</span></th>
              <th className="num" data-col="1">#</th>
              <th>{t("markets.coin")}</th>
              {cols.map(([k, label], i) => (
                <th key={k} className={`num${k === "y1" || k === "dd" || k === "vol" ? " hide-sm" : ""}`} data-col={i + 3}>
                  {k === "dd" ? <Term id="drawdown">{label}</Term> : k === "vol" ? <Term id="volatility">{label}</Term> : label}
                </th>
              ))}
              <th className="spark-col">{t("markets.last90")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const asset = assetByPair(r.pair)!;
              const name = t(`crypto.assets.${asset.slug}` as never);
              return (
                <tr key={r.pair} data-slug={asset.slug} data-search={`${name} ${asset.label}`.toLowerCase()}>
                  <td className="star-col">
                    <button type="button" className="star" data-star={asset.slug} aria-pressed="false" hidden data-needs-js=""
                            data-label-on={t("markets.unwatch")} data-label-off={t("markets.watch")} aria-label={`${t("markets.watch")}: ${name}`}>☆</button>
                  </td>
                  <td className="num muted" data-v={i + 1}>{i + 1}</td>
                  <td>
                    <Link className="sym" href={`/crypto/${asset.slug}`}>{name}</Link>
                    <span className="sub">{asset.label}</span>
                  </td>
                  <td className="num" data-v={num(r.close)}>{price(r.close, asset.quote)}</td>
                  <td className={`num ${tone(r.ret_1d)}`} data-v={num(r.ret_1d)}>{pct(r.ret_1d)}</td>
                  <td className={`num ${tone(r.ret_7d)}`} data-v={num(r.ret_7d)}>{pct(r.ret_7d)}</td>
                  <td className={`num ${tone(r.ret_30d)}`} data-v={num(r.ret_30d)}>{pct(r.ret_30d)}</td>
                  <td className={`num hide-sm ${tone(r.ret_1y)}`} data-v={num(r.ret_1y)}>{pct(r.ret_1y)}</td>
                  <td className="num hide-sm" data-v={num(r.drawdown)}>{pct(r.drawdown, 1)}</td>
                  <td className="num hide-sm" data-v={num(r.vol_30d)}>{percent(r.vol_30d == null ? null : r.vol_30d * 100, 0)}</td>
                  <td className="spark-col"><Sparkline values={recent[r.pair] ?? []} label={`${name}, ${t("markets.last90")}`} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
