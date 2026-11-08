import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FOCUS, isPath, stepHref, stepsFor } from "@/lib/onboarding";
import { decodeSegment } from "@/lib/params";

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }) {
  const path = decodeSegment((await params).path);
  const t = await getTranslations();
  return { title: isPath(path) ? t(`start.paths.${path}.title`) : t("start.title") };
}

// One starting point: who it is for, a few true figures (sourced), one question about what they want to understand
// first (answered by a link, so it works without JavaScript and stores nothing), and three next steps.
export default async function StartPathPage({ params, searchParams }: {
  params: Promise<{ path: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const path = decodeSegment((await params).path);
  if (!isPath(path)) notFound();
  const [t, query] = await Promise.all([getTranslations(), searchParams]);
  const asked = typeof query.focus === "string" ? query.focus : undefined;
  const { focus, steps } = stepsFor(path, asked);
  const stats = (t.raw(`start.paths.${path}.stats`) ?? []) as { value: string; text: string; source: string; url: string }[];
  const label = (s: (typeof steps)[number]) =>
    "lesson" in s ? t(`basics.lessons.${s.lesson}.title` as never)
    : "chart" in s ? t(`charts.items.${s.chart}.title` as never) : t(`start.links.${s.label}` as never);
  const summary = (s: (typeof steps)[number]) =>
    "lesson" in s ? t(`basics.lessons.${s.lesson}.summary` as never)
    : "chart" in s ? t(`charts.items.${s.chart}.summary` as never) : t(`start.links.${s.label}Summary` as never);
  const kind = (s: (typeof steps)[number]) => ("lesson" in s ? t("start.kindLesson") : "chart" in s ? t("start.kindChart") : t("start.kindPage"));

  return (
    <div className="start">
      <p className="small"><Link href="/start">← {t("start.change")}</Link></p>
      <h1>{t(`start.paths.${path}.title`)}</h1>
      <p className="lead">{t(`start.paths.${path}.intro`)}</p>

      {stats.length > 0 && (
        <ul className="seen" aria-label={t("start.seenLabel")}>
          {stats.map((s) => (
            <li key={s.text}>
              <strong>{s.value}</strong>
              <span>{s.text}</span>
              <a className="small" href={s.url} rel="noopener noreferrer">{s.source}</a>
            </li>
          ))}
        </ul>
      )}

      <section className="card focus">
        <h2>{t(`start.paths.${path}.question`)}</h2>
        <div className="focus-options">
          {Object.keys(FOCUS[path]).map((f) => (
            <Link key={f} href={`/start/${path}?focus=${f}`} aria-current={f === focus ? "true" : undefined} scroll={false}>
              {t(`start.paths.${path}.options.${f}` as never)}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title">{t("start.stepsTitle")}</h2>
        <p className="section-sub">{t("start.stepsSub")}</p>
        <ol className="steps start-steps">
          {steps.map((s) => (
            <li key={stepHref(s)}>
              <Link href={stepHref(s)}>
                <strong>{label(s)}</strong>
                <span>{kind(s)} · {summary(s)}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: 24 }}>
          <Link className="button" href={stepHref(steps[0])}>{t("start.begin")} →</Link>
        </p>
      </section>
      <p className="small muted" style={{ marginTop: 24 }}>{t("start.note")}</p>
    </div>
  );
}
