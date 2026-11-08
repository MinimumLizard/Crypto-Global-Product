import { getTranslations } from "next-intl/server";

import PathChooser from "@/components/PathChooser";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("start.title") };
}

export default async function StartPage() {
  const t = await getTranslations();
  return (
    <div className="start">
      <h1>{t("start.question")}</h1>
      <p className="lead">{t("start.intro")}</p>
      <PathChooser heading={false} />
    </div>
  );
}
