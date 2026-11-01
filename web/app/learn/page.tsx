import { getTranslations } from "next-intl/server";

import Link from "next/link";

import { GLOSSARY } from "@/lib/glossary";
import { LESSONS } from "@/lib/lessons";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("learn.title") };
}

// Plain-language explanations of every term the site uses. Each has an anchor, so a term anywhere links here.
export default async function LearnPage() {
  const t = await getTranslations();
  return (
    <>
      <h1>{t("basics.title")}</h1>
      <p className="lead">{t("basics.intro")}</p>
      <ol className="steps" style={{ marginBottom: 40 }}>
        {LESSONS.map((l) => (
          <li key={l.slug}>
            <Link href={`/learn/basics/${l.slug}`}>
              <strong>{t(`basics.lessons.${l.slug}.title` as never)}</strong>
              <span>{t(`basics.lessons.${l.slug}.summary` as never)}</span>
            </Link>
          </li>
        ))}
      </ol>
      <h2>{t("learn.glossaryTitle")}</h2>
      <p className="lead">{t("learn.intro")}</p>
      <div className="letters" aria-label={t("learn.title")}>
        {GLOSSARY.map((id) => (
          <a key={id} href={`#${id}`}>{t(`learn.terms.${id}.name` as never)}</a>
        ))}
      </div>
      <div className="learn-grid">
        {GLOSSARY.map((id, i) => (
          <section key={id} id={id} className="card">
            <span className="kicker">{t("learn.lessonN", { n: i + 1 })}</span>
            <h2 style={{ fontSize: "1.3rem", marginTop: 4 }}>{t(`learn.terms.${id}.name` as never)}</h2>
            <p><strong>{t(`learn.terms.${id}.short` as never)}</strong></p>
            <p className="muted" style={{ marginBottom: 0 }}>{t(`learn.terms.${id}.long` as never)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
