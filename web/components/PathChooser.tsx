import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PATHS } from "@/lib/onboarding";

// "Where are you starting from?": four big choices, each leading to its own page with one next step at a time.
export default async function PathChooser({ heading = true }: { heading?: boolean }) {
  const t = await getTranslations();
  return (
    <section className="chooser" aria-labelledby={heading ? "chooser-title" : undefined}>
      {heading && <h2 id="chooser-title">{t("start.question")}</h2>}
      <div className="chooser-options">
        {PATHS.map((p) => (
          <Link key={p} href={`/start/${p}`} className="chooser-option">
            <strong>{t(`start.paths.${p}.choice`)}</strong>
            <span>{t(`start.paths.${p}.hint`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
