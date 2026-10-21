import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Logo from "./Logo";
import NavLinks from "./NavLinks";
import Ticker from "./Ticker";
import type { Viewer } from "@/lib/entitlements";

export default async function SiteHeader({ viewer }: { viewer: Viewer }) {
  const t = await getTranslations();
  const links = [
    ["/", t("nav.home")],
    ["/learn", t("nav.learn")],
    ["/crypto", t("nav.crypto")],
    ["/methods", t("nav.methods")],
    ["/plans", t("nav.plans")],
  ] as const;
  const name = t("site.name");
  // The mark's two halves: "Coin" in the accent colour, the rest in the text colour.
  const split = name.startsWith("Coin") ? 4 : 0;
  return (
    <header className="site">
      <div className="container bar">
        <Link href="/" className="brand" aria-label={name}>
          <Logo size={28} />
          <span>
            <span className="coin">{name.slice(0, split)}</span>
            {name.slice(split)}
          </span>
        </Link>
        <NavLinks links={[...links]} label={t("nav.label")} />
        <Link href="/plans" className="tier-badge">
          {t("tiers.viewing", { tier: t(`tiers.${viewer.tier}`) })}
        </Link>
      </div>
      <Ticker viewer={viewer} />
    </header>
  );
}
