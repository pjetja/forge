'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ForgeLogo } from '@/components/ForgeLogo';
import { GravatarAvatar } from '@/components/GravatarAvatar';
import { signOut } from '@/app/(auth)/login/actions';

const navLinks = [
  {
    href: '/trainee',
    label: 'Plans',
    isActive: (pathname: string) =>
      pathname === '/trainee' || pathname.startsWith('/trainee/plans'),
  },
  {
    href: '/trainee/exercises',
    label: 'Exercises',
    isActive: (pathname: string) => pathname.startsWith('/trainee/exercises'),
  },
  {
    href: '/help',
    label: 'Help',
    isActive: (_pathname: string) => false,
  },
];

export function TraineeNavHeader({ avatarUrl, userName }: { avatarUrl: string; userName: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <>
      <header className="bg-bg-page border-b border-border">
        {/* Row 1: Logo | Avatar (desktop) / Hamburger (mobile) */}
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/trainee" aria-label="Forge home" className="flex items-center">
            <ForgeLogo variant="horizontal" className="h-7" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Avatar + Sign out — desktop only */}
            <div className="hidden md:flex items-center gap-3">
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
                  aria-label="Sign out"
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
              aria-label="Open menu"
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

        {/* Row 2: Nav links — desktop only */}
        <nav className="hidden md:flex border-t border-border px-4 py-2 gap-6">
          {navLinks.map(({ href, label, isActive }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                isActive(pathname)
                  ? 'text-accent font-medium'
                  : 'text-text-primary hover:text-accent'
              }`}
            >
              {label}
            </Link>
          ))}
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
                aria-label="Close menu"
                className="w-7 h-7 flex items-center justify-center text-text-primary hover:text-accent transition-colors cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-4 py-4 gap-4 flex-1">
              {navLinks.map(({ href, label, isActive }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`text-sm transition-colors ${
                    isActive(pathname)
                      ? 'text-accent font-medium'
                      : 'text-text-primary hover:text-accent'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Profile + Sign out at bottom */}
            <div className="px-4 py-4 border-t border-border space-y-3">
              <Link
                href="/trainee/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 text-sm text-text-primary hover:text-accent transition-colors"
              >
                <GravatarAvatar url={avatarUrl} name={userName} size={32} />
                Profile
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-text-primary hover:text-accent transition-colors cursor-pointer"
                  aria-label="Sign out"
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
