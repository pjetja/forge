import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function GuidePage() {
  const t = await getTranslations("common");

  return (
    <main className="bg-bg-page min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-8">
          {t("guide.heading")}
        </h1>

        <Link
          href="/help"
          className="text-sm text-accent hover:text-accent-hover transition-colors mb-8 inline-block"
        >
          {t("guide.backToHelp")}
        </Link>

        {/* For Trainers */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {t("guide.trainers.sectionHeading")}
          </h2>
          <p
            className="text-base text-text-primary mb-6"
            style={{ opacity: 0.8 }}
          >
            {t("guide.trainers.intro")}
          </p>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              1. {t("guide.trainers.step1Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainers.step1Body")}
            </p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              2. {t("guide.trainers.step2Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainers.step2Body")}
            </p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              3. {t("guide.trainers.step3Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainers.step3Body")}
            </p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              4. {t("guide.trainers.step4Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainers.step4Body")}
            </p>
          </div>
        </section>

        {/* For Trainees */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {t("guide.trainees.sectionHeading")}
          </h2>
          <p
            className="text-base text-text-primary mb-6"
            style={{ opacity: 0.8 }}
          >
            {t("guide.trainees.intro")}
          </p>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              1. {t("guide.trainees.step1Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainees.step1Body")}
            </p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              2. {t("guide.trainees.step2Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainees.step2Body")}
            </p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">
              3. {t("guide.trainees.step3Title")}
            </h3>
            <p
              className="text-base text-text-primary mb-6"
              style={{ opacity: 0.8 }}
            >
              {t("guide.trainees.step3Body")}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
