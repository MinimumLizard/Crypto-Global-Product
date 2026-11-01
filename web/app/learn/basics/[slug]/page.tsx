import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LESSONS, lessonIndex } from "@/lib/lessons";
import { decodeSegment } from "@/lib/params";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const i = lessonIndex(decodeSegment((await params).slug));
  const t = await getTranslations();
  return { title: i < 0 ? t("basics.title") : t(`basics.lessons.${LESSONS[i].slug}.title` as never) };
}

// One lesson of the free Crypto basics course: its sections, its key points, where to see it on the site, and the
// next lesson. No data is read here.
export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const i = lessonIndex(decodeSegment((await params).slug));
  if (i < 0) notFound();
  const t = await getTranslations();
  const lesson = LESSONS[i];
  const k = (part: string) => `basics.lessons.${lesson.slug}.${part}` as never;
  const sections = t.raw(k("sections")) as { heading: string; paragraphs: string[] }[];
  const points = t.raw(k("points")) as string[];
  const next = LESSONS[i + 1];
  const seeLabel = (href: string) =>
    href.startsWith("/charts/") ? t(`charts.items.${href.slice(8)}.title` as never)
    : href.startsWith("/learn#") ? t(`learn.terms.${href.slice(7)}.name` as never)
    : href === "/crypto/btc" ? t("crypto.assets.btc") : t("nav.crypto");
  return (
    <article className="lesson">
      <p className="small"><Link href="/learn">← {t("basics.back")}</Link></p>
      <span className="kicker">{t("basics.lesson", { n: i + 1 })} · {t("basics.minutes", { n: t.raw(k("minutes")) as number })}</span>
      <h1>{t(k("title"))}</h1>
      <p className="lead">{t(k("summary"))}</p>
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </section>
      ))}
      <aside className="explain" style={{ marginTop: 24 }}>
        <span className="label">{t("basics.points")}</span>
        <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
      </aside>
      {lesson.see.length > 0 && (
        <p className="small" style={{ marginTop: 16 }}>
          {t("basics.see")}{" "}
          {lesson.see.map((href, j) => <span key={href}>{j > 0 && " · "}<Link href={href}>{seeLabel(href)}</Link></span>)}
        </p>
      )}
      {next && (
        <p style={{ marginTop: 24 }}>
          <Link className="button" href={`/learn/basics/${next.slug}`}>{t("basics.next")}: {t(`basics.lessons.${next.slug}.title` as never)} →</Link>
        </p>
      )}
    </article>
  );
}
