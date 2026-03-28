'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ForgeLogo } from '@/components/ForgeLogo';
import { GravatarAvatar } from '@/components/GravatarAvatar';

const navLinks = [
  {
    href: '/trainer',
    label: 'Trainees',
    isActive: (pathname: string) =>
      pathname === '/trainer' || pathname.startsWith('/trainer/trainees'),
  },
  {
    href: '/trainer/plans',
    label: 'Plans',
    isActive: (pathname: string) => pathname.startsWith('/trainer/plans'),
  },
  {
    href: '/trainer/exercises',
    label: 'Exercise Library',
    isActive: (pathname: string) => pathname.startsWith('/trainer/exercises'),
  },
  {
    href: '/help',
    label: 'Help',
    isActive: (_pathname: string) => false,
  },
];

export function NavHeader({ avatarUrl, userName }: { avatarUrl: string; userName: string }) {
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
          <Link href="/trainer" aria-label="Forge home" className="flex items-center">
            <ForgeLogo variant="horizontal" className="h-7" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Avatar linking to profile — desktop only */}
            <div className="hidden md:block">
              <Link
                href="/trainer/profile"
                className="block rounded-full hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-bg-page transition-shadow"
              >
                <GravatarAvatar url={avatarUrl} name={userName} size={32} />
              </Link>
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

            {/* Profile link at bottom */}
            <div className="px-4 py-4 border-t border-border">
              <Link
                href="/trainer/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 text-sm text-text-primary hover:text-accent transition-colors"
              >
                <GravatarAvatar url={avatarUrl} name={userName} size={32} />
                Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
