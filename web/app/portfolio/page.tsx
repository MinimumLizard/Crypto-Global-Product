import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Locked from "@/components/Locked";
import { CRYPTO_ASSETS, assetByPair, price } from "@/lib/crypto-display";
import { cryptoOverview } from "@/lib/data/crypto";
import { date, pct, tone } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("portfolio.title") };
}

// "My coins": the visitor's watchlist and a portfolio tracker. Both live in the visitor's own browser storage
// (public/terminal.js); this page only renders every coin's row with its latest close (free data), hidden until the
// script shows the ones the visitor chose. Nothing the visitor enters is sent to the server. The tracker values coins
// and shows shares of the total; it never suggests what to change (hard rule 3).
export default async function PortfolioPage() {
  const [t, viewer] = await Promise.all([getTranslations(), getViewer()]);
  const overview = await cryptoOverview(viewer);
  const order = (pair: string) => CRYPTO_ASSETS.findIndex((a) => a.pair === pair);
  const rows = [...(overview.data?.latest ?? [])]
    .filter((r) => assetByPair(r.pair)?.quote === "USD").sort((a, b) => order(a.pair) - order(b.pair));
  const name = (pair: string) => t(`crypto.assets.${assetByPair(pair)!.slug}` as never);

  return (
    <>
      <h1>{t("portfolio.title")}</h1>
      <p className="lead">{t("portfolio.intro")}</p>
      <noscript><p className="notice warn">{t("portfolio.needsJs")}</p></noscript>
      {!overview.access.allowed ? <Locked access={overview.access} /> : (
        <>
          <section className="card" style={{ marginTop: 16 }}>
            <h2>{t("portfolio.watchTitle")}</h2>
            <p className="muted" data-watch-empty="">{t("portfolio.watchEmpty")}</p>
            <ul className="watch-list">
              {rows.map((r) => {
                const a = assetByPair(r.pair)!;
                return (
                  <li key={r.pair} data-watch-row={a.slug} hidden>
                    <button type="button" className="star" suppressHydrationWarning data-star={a.slug} aria-pressed="true" hidden data-needs-js=""
                            data-label-on={t("markets.unwatch")} data-label-off={t("markets.watch")} aria-label={`${t("markets.unwatch")}: ${name(r.pair)}`}>★</button>
                    <Link href={`/crypto/${a.slug}`}>{name(r.pair)}</Link>
                    <span className="num">{price(r.close)}</span>
                    <span className={`chip ${tone(r.ret_1d)}`}>{pct(r.ret_1d)}</span>
                    <span className={`chip ${tone(r.ret_7d)}`}>{pct(r.ret_7d)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card" style={{ marginTop: 16 }} data-portfolio="" hidden data-needs-js="">
            <h2>{t("portfolio.portTitle")}</h2>
            <p className="muted">{t("portfolio.portIntro")}</p>
            <form className="port-add" data-port-add="">
              <label>{t("portfolio.coin")}
                <select name="coin" required defaultValue="">
                  <option value="" disabled>{t("portfolio.choose")}</option>
                  {rows.map((r) => <option key={r.pair} value={assetByPair(r.pair)!.slug} data-coin="">{name(r.pair)}</option>)}
                </select>
              </label>
              <label>{t("portfolio.amount")}<input name="amount" type="number" min="0" step="any" required inputMode="decimal" /></label>
              <label>{t("portfolio.paid")}<input name="paid" type="number" min="0" step="any" inputMode="decimal" /></label>
              <button type="submit" className="button">{t("portfolio.add")}</button>
            </form>
            <p className="muted" data-port-empty="">{t("portfolio.empty")}</p>
            <div className="table-wrap" data-port-table="" hidden>
              <table>
                <thead>
                  <tr>
                    <th>{t("portfolio.coin")}</th><th className="num">{t("portfolio.amount")}</th><th className="num">{t("portfolio.paid")}</th>
                    <th className="num">{t("portfolio.price")}</th><th className="num">{t("portfolio.value")}</th>
                    <th className="num">{t("portfolio.share")}</th><th className="num">{t("portfolio.change")}</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const a = assetByPair(r.pair)!;
                    return (
                      <tr key={r.pair} data-port-row={a.slug} data-price={String(r.close)} hidden>
                        <td><Link href={`/crypto/${a.slug}`}>{name(r.pair)}</Link></td>
                        <td className="num"><input type="number" min="0" step="any" data-amount="" aria-label={t("portfolio.amount")} /></td>
                        <td className="num"><input type="number" min="0" step="any" data-paid="" aria-label={t("portfolio.paid")} /></td>
                        <td className="num">{price(r.close)}</td>
                        <td className="num" data-value="" suppressHydrationWarning>—</td>
                        <td className="num" data-share="" suppressHydrationWarning>—</td>
                        <td className="num" data-change="" suppressHydrationWarning>—</td>
                        <td><button type="button" className="link-button" data-port-remove={a.slug}>{t("portfolio.remove")}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <dl className="facts port-total">
              <dt>{t("portfolio.total")}</dt><dd data-total="" suppressHydrationWarning>—</dd>
              <dt>{t("portfolio.totalChange")}</dt><dd data-total-change="" suppressHydrationWarning>—</dd>
            </dl>
            <p className="small muted">
              {t("portfolio.note", { date: date(overview.data?.day ?? null) })}{" "}
              <button type="button" className="link-button" data-port-clear="">{t("portfolio.clear")}</button>
            </p>
          </section>
        </>
      )}
    </>
  );
}
