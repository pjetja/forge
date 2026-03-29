import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from './constants';
import type { Locale } from './constants';

function isValidLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isValidLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  const [common, auth, trainer, trainee] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/trainer.json`),
    import(`../../messages/${locale}/trainee.json`),
  ]);

  return {
    locale,
    messages: {
      ...common.default,
      ...auth.default,
      ...trainer.default,
      ...trainee.default,
    },
  };
});
