'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ForgeLogo } from '@/components/ForgeLogo';
import { GravatarAvatar } from '@/components/GravatarAvatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { signOut } from '@/app/(auth)/login/actions';
import type { Locale } from '@/i18n/constants';
import type { ReadonlyURLSearchParams } from 'next/navigation';

const navLinks: {
  href: string;
  labelKey: string;
  isActive: (pathname: string, searchParams: ReadonlyURLSearchParams) => boolean;
}[] = [
  {
    href: '/trainee',
    labelKey: 'nav.plans',
    isActive: (pathname, searchParams) =>
      (pathname === '/trainee' && !searchParams.get('tab')) ||
      (pathname === '/trainee' && searchParams.get('tab') === 'plans') ||
      pathname.startsWith('/trainee/plans'),
  },
  {
    href: '/trainee?tab=log',
    labelKey: 'nav.log',
    isActive: (pathname, searchParams) =>
      pathname === '/trainee' && searchParams.get('tab') === 'log',
  },
  {
    href: '/trainee/exercises',
    labelKey: 'nav.exercises',
    isActive: (pathname, _sp) => pathname.startsWith('/trainee/exercises'),
  },
  {
    href: '/help',
    labelKey: 'nav.help',
    isActive: (_pathname, _sp) => false,
  },
];

export function TraineeNavHeader({ avatarUrl, userName, locale }: { avatarUrl: string; userName: string; locale: Locale }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('common');

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <>
      <header className="bg-bg-page border-b border-border">
        {/* Row 1: Logo | Avatar (desktop) / Hamburger (mobile) */}
        <div className="h-14">
          <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/trainee" aria-label={t('aria.forgeHome')} className="flex items-center">
            <ForgeLogo variant="horizontal" className="h-7" />
          </Link>

          <div className="flex items-center gap-3">
            {/* LanguageSwitcher + Avatar + Sign out — desktop only */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher currentLocale={locale} />
              <Link
                href="/trainee/profile"
                className="block rounded-full hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-bg-page transition-shadow"
              >
                <GravatarAvatar url={avatarUrl} name={userName} size={32} />
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-text-primary hover:text-accent transition-colors cursor-pointer"
                  aria-label={t('aria.signOut')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('aria.openMenu')}
              className="md:hidden w-7 h-7 flex items-center justify-center text-text-primary hover:text-accent transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          </div>
        </div>

        {/* Row 2: Nav links — desktop only */}
        <nav className="hidden md:flex border-t border-border">
          <div className="max-w-[1280px] mx-auto px-4 w-full flex items-center py-2 gap-6">
          {navLinks.map(({ href, labelKey, isActive }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                isActive(pathname, searchParams)
                  ? 'text-accent font-medium'
                  : 'text-text-primary hover:text-accent'
              }`}
            >
              {t(labelKey)}
            </Link>
          ))}
          </div>
        </nav>
      </header>

      {/* Mobile side panel */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed left-0 top-0 h-full w-64 bg-bg-surface border-r border-border flex flex-col z-10">
            {/* Panel header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
              <ForgeLogo variant="horizontal" className="h-7" />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label={t('aria.closeMenu')}
                className="w-7 h-7 flex items-center justify-center text-text-primary hover:text-accent transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-4 py-4 gap-4 flex-1">
              {navLinks.map(({ href, labelKey, isActive }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`text-sm transition-colors ${
                    isActive(pathname, searchParams)
                      ? 'text-accent font-medium'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  {t(labelKey)}
                </Link>
              ))}
            </nav>

            {/* Language Switcher + Profile + Sign out at bottom */}
            <div className="px-4 py-4 border-t border-border space-y-3">
              <div className="flex items-center min-h-[44px]"><LanguageSwitcher currentLocale={locale} /></div>
              <Link
                href="/trainee/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 text-sm text-text-primary hover:text-accent transition-colors"
              >
                <GravatarAvatar url={avatarUrl} name={userName} size={32} />
                {t('nav.profile')}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-text-primary hover:text-accent transition-colors cursor-pointer"
                  aria-label={t('aria.signOut')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
