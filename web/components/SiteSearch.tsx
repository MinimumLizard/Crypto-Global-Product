import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CHARTS, isLive } from "@/lib/chart-catalogue";
import { CRYPTO_ASSETS } from "@/lib/crypto-display";
import { LESSONS } from "@/lib/lessons";

// One search box for coins, charts and lessons. Every result is rendered here as an ordinary link (hidden); the
// box itself and the filtering appear once public/terminal.js runs. No data is read: the index is the site's own map.
export default async function SiteSearch() {
  const t = await getTranslations();
  const items = [
    ...CRYPTO_ASSETS.map((a) => ({ href: `/crypto/${a.slug}`, title: t(`crypto.assets.${a.slug}` as never), extra: a.label, kind: t("search.coin") })),
    ...CHARTS.filter(isLive).map((c) => ({ href: `/charts/${c.slug}`, title: t(`charts.items.${c.slug}.title` as never), extra: "", kind: t("search.chart") })),
    ...LESSONS.map((l) => ({ href: `/learn/basics/${l.slug}`, title: t(`basics.lessons.${l.slug}.title` as never), extra: "", kind: t("search.lesson") })),
    ...([["/start", "nav.start"], ["/portfolio", "nav.portfolio"], ["/plans", "nav.plans"], ["/methods", "nav.methods"]] as const)
      .map(([href, key]) => ({ href, title: t(key), extra: "", kind: t("search.page") })),
  ];
  return (
    <div className="site-search" data-needs-js="" hidden>
      <input type="search" data-search-input="site-search-results" placeholder={t("search.placeholder")} aria-label={t("search.label")} />
      <ul id="site-search-results" className="search-results" hidden>
        {items.map((i) => (
          <li key={i.href} hidden data-text={`${i.title} ${i.extra}`.toLowerCase()}>
            <Link href={i.href}>{i.title}<span>{i.kind}</span></Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
