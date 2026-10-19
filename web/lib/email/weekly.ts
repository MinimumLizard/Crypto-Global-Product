// Builds the weekly e-mail for one market and one tier. Every number is read through the site's data functions,
// which pass the single tier check (lib/entitlements.ts), so a free subscriber's e-mail cannot carry a paid number:
// hard rule 4 applies to e-mail exactly as to pages, and the tier-leak tests check the preview page (/email/crypto).
import "server-only";

import { getTranslations } from "next-intl/server";

import { SITE_WIDE_DISCLAIMERS } from "@/components/Disclaimer";
import { CRYPTO_ASSETS, assetByPair, price } from "../crypto-display";
import { cryptoCycle, cryptoOverview, cryptoTrend } from "../data/crypto";
import type { Viewer } from "../entitlements";
import { date, int, num, pct, ratio, tone } from "../format";
import { registry } from "../registry";
import type { Digest, Section } from "./digest";

export const MARKETS = ["crypto"] as const;
export type Market = (typeof MARKETS)[number];
export function isMarket(v: unknown): v is Market {
  return typeof v === "string" && (MARKETS as readonly string[]).includes(v);
}

export interface Links {
  site: string; // "" for links within the site (the preview); the full address in a sent e-mail
  unsubscribe: string; // filled in per subscriber by the sender: the only part that differs between two e-mails
}

const translator = () => getTranslations();
type T = Awaited<ReturnType<typeof translator>>;

async function cryptoSections(t: T, viewer: Viewer, links: Links): Promise<{ day: string | null; sections: Section[]; preheader: string }> {
  const overview = await cryptoOverview(viewer);
  const day = overview.data?.day ?? null;
  if (!day) return { day: null, sections: [], preheader: "" };
  const order = (pair: string) => CRYPTO_ASSETS.findIndex((a) => a.pair === pair);
  const rows = [...(overview.data?.latest ?? [])].filter((r) => assetByPair(r.pair)).sort((a, b) => order(a.pair) - order(b.pair));
  const name = (pair: string) => t(`crypto.assets.${assetByPair(pair)!.slug}` as never);
  const week = (pair: string) => rows.find((r) => r.pair === pair)?.ret_7d ?? null;
  const plans = `${links.site}/plans`;
  const sections: Section[] = [{
    title: t("email.crypto.numbers"),
    intro: t("email.crypto.intro"),
    table: {
      head: [t("email.crypto.asset"), t("email.crypto.close"), t("email.crypto.fromHigh"), t("email.crypto.week")],
      rows: rows.map((r) => ({ cells: [name(r.pair), price(r.close, assetByPair(r.pair)!.quote), pct(r.drawdown, 1), pct(r.ret_7d, 1)], tone: tone(r.ret_7d) })),
    },
    empty: t("email.noData"),
  }];

  // Plus and Pro: a subscriber below the tier gets the invitation, never the figures (and not a delayed free preview
  // either: an e-mail dated this week should not carry last week's numbers as if they were this week's).
  const [cycle, trend] = await Promise.all([cryptoCycle(viewer, "btcusd", { history: false }), cryptoTrend(viewer, "btcusd", { history: false })]);
  const c = cycle.access.allowed && !cycle.access.maxDate ? cycle.data?.daily[0] ?? null : null;
  if (c) {
    sections.push({
      title: t("email.crypto.cycle"), intro: t("email.crypto.cycleIntro"),
      lines: [
        { label: t("email.crypto.vs200w"), value: c.sma_200w ? pct(c.close / c.sma_200w - 1, 1) : "—",
          note: t("email.crypto.vs200wNote", { value: price(c.sma_200w) }) },
        { label: t("email.crypto.mayer"), value: ratio(c.mayer) },
        { label: t("email.crypto.halving"), value: int(c.days_since_halving) },
      ],
    });
  } else if (!cycle.access.allowed || cycle.access.maxDate) {
    sections.push({ title: t("email.crypto.cycle"), locked: { text: t("email.crypto.cycleLocked"), cta: t("email.crypto.seePlans"), href: plans, model: "crypto_cycle" } });
  }
  if (trend.access.allowed && !trend.access.maxDate && trend.data?.rows.length) {
    sections.push({
      title: t("email.crypto.trend"), intro: t("email.crypto.trendIntro"),
      lines: trend.data.rows.map((r) => ({ label: t(`email.crypto.fit_${r.fit}`), value: num(r.position, 2),
                                           note: t("email.crypto.fitted", { value: price(r.fitted) }) })),
    });
  } else if (!trend.access.allowed || trend.access.maxDate) {
    sections.push({ title: t("email.crypto.trend"), locked: { text: t("email.crypto.trendLocked"), cta: t("email.crypto.seePlans"), href: plans, model: "crypto_trend_bands" } });
  }
  sections[sections.length - 1].link = { label: t("email.crypto.link"), href: `${links.site}/crypto` };
  return { day, sections, preheader: t("email.crypto.preheader", { btc: pct(week("btcusd"), 1), eth: pct(week("ethusd"), 1), date: date(day) }) };
}

/** The e-mail one tier's subscribers get for one market this week. */
export async function weeklyDigest(viewer: Viewer, market: Market, links: Links): Promise<Digest> {
  const t = await translator();
  const name = t(`email.markets.${market}`);
  const built = await cryptoSections(t, viewer, links);
  const when = built.day ? date(built.day) : null;
  return {
    subject: when ? t("email.subject", { market: name, date: when }) : t("email.subjectNoData", { market: name }),
    preheader: built.preheader || t("email.noData"),
    eyebrow: t("email.eyebrow", { tier: t(`tiers.${viewer.tier}`) }),
    heading: when ? t("email.heading", { market: name, date: when }) : t("email.headingNoData", { market: name }),
    sections: built.sections.length ? built.sections : [{ title: name, empty: t("email.noData") }],
    disclaimers: [...SITE_WIDE_DISCLAIMERS, "crypto_risk"].map((k) => registry.disclaimers[k]?.en).filter((x): x is string => !!x),
    footer: [t("email.footer", { market: name })],
    unsubscribe: { label: t("email.unsubscribe"), href: links.unsubscribe },
  };
}
