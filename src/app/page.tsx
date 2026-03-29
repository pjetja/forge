import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ForgeLogo } from '@/components/ForgeLogo';

export default async function Home() {
  const t = await getTranslations('common');

  return (
    <main className="bg-bg-page min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-[640px] mx-auto w-full flex flex-col items-center">
          <ForgeLogo variant="horizontal" className="h-10" />
          <h1 className="text-4xl font-bold text-text-primary text-center mt-8">
            {t('landing.heroHeading')}
          </h1>
          <p
            className="text-base text-text-primary text-center mt-4"
            style={{ opacity: 0.8 }}
          >
            {t('landing.heroSubheading')}
          </p>
          <div className="mt-8 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:gap-4">
            <Link
              href="/signup/trainer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-sm font-bold text-base bg-accent text-white hover:bg-accent-hover transition-colors min-h-[44px] cursor-pointer"
            >
              {t('landing.ctaTrainer')}
            </Link>
            <Link
              href="/signup/trainee"
              className="inline-flex items-center justify-center px-6 py-3 rounded-sm font-bold text-base border border-border text-text-primary hover:border-accent hover:text-accent transition-colors min-h-[44px] cursor-pointer bg-transparent"
            >
              {t('landing.ctaTrainee')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 md:py-12">
        <div className="max-w-[960px] mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">{t('landing.whyForge')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Card 1: Build structured plans */}
            <div className="bg-bg-surface border border-border rounded-sm p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="28"
                height="28"
                className="text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <line x1="12" y1="11" x2="16" y2="11" />
                <line x1="12" y1="16" x2="16" y2="16" />
                <line x1="8" y1="11" x2="8.01" y2="11" />
                <line x1="8" y1="16" x2="8.01" y2="16" />
              </svg>
              <h3 className="text-base font-bold text-text-primary mt-4">{t('landing.feature1Title')}</h3>
              <p className="text-sm text-text-primary mt-2" style={{ opacity: 0.7 }}>
                {t('landing.feature1Description')}
              </p>
            </div>

            {/* Card 2: Log workouts in seconds */}
            <div className="bg-bg-surface border border-border rounded-sm p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="28"
                height="28"
                className="text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h3 className="text-base font-bold text-text-primary mt-4">{t('landing.feature2Title')}</h3>
              <p className="text-sm text-text-primary mt-2" style={{ opacity: 0.7 }}>
                {t('landing.feature2Description')}
              </p>
            </div>

            {/* Card 3: Track progress over time */}
            <div className="bg-bg-surface border border-border rounded-sm p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="28"
                height="28"
                className="text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 18 8 13 13 9 9 2 16" />
                <polyline points="22 12 22 8 18 8" />
              </svg>
              <h3 className="text-base font-bold text-text-primary mt-4">{t('landing.feature3Title')}</h3>
              <p className="text-sm text-text-primary mt-2" style={{ opacity: 0.7 }}>
                {t('landing.feature3Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
            {t('landing.footerLogin')}
          </Link>
          <Link href="/help" className="text-text-primary hover:text-accent transition-colors">
            {t('landing.footerHelp')}
          </Link>
        </div>
      </footer>
    </main>
  );
}
