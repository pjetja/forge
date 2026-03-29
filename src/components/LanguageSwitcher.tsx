'use client';
import { LOCALE_COOKIE } from '@/i18n/constants';
import type { Locale } from '@/i18n/constants';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  function switchLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div role="group" aria-label={currentLocale === 'pl' ? 'Jezyk' : 'Language'} className="flex items-center text-sm">
      <button
        onClick={() => currentLocale !== 'pl' && switchLocale('pl')}
        aria-pressed={currentLocale === 'pl'}
        aria-label="Polski"
        className={currentLocale === 'pl'
          ? 'text-accent font-bold cursor-default'
          : 'text-text-primary/50 hover:text-accent font-bold transition-colors cursor-pointer'}
      >
        PL
      </button>
      <span aria-hidden="true" className="text-border mx-1">|</span>
      <button
        onClick={() => currentLocale !== 'en' && switchLocale('en')}
        aria-pressed={currentLocale === 'en'}
        aria-label="English"
        className={currentLocale === 'en'
          ? 'text-accent font-bold cursor-default'
          : 'text-text-primary/50 hover:text-accent font-bold transition-colors cursor-pointer'}
      >
        EN
      </button>
    </div>
  );
}
