import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function HelpPage() {
  const t = await getTranslations('common');

  return (
    <main className="bg-bg-page min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Page heading */}
        <h1 className="text-2xl font-bold text-text-primary mb-8">{t('help.heading')}</h1>

        {/* Back to home link for unauthenticated users */}
        <Link href="/" className="text-sm text-accent hover:text-accent-hover transition-colors mb-8 inline-block">{t('help.backToHome')}</Link>

        {/* For Trainers section */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">{t('help.trainers.sectionHeading')}</h2>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">{t('help.trainers.q1')}</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>{t('help.trainers.a1')}</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">{t('help.trainers.q2')}</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>{t('help.trainers.a2')}</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">{t('help.trainers.q3')}</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>{t('help.trainers.a3')}</p>
          </div>
        </section>

        {/* For Trainees section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">{t('help.trainees.sectionHeading')}</h2>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">{t('help.trainees.q1')}</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>{t('help.trainees.a1')}</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">{t('help.trainees.q2')}</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>{t('help.trainees.a2')}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
