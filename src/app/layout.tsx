import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import './globals.css';

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Forge',
  description: 'Track your training. Forge your progress.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={lato.variable}>
      <body className="antialiased">
        <NextTopLoader color="#4ade80" shadow={false} showSpinner={false} height={2} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
