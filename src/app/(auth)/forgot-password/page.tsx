'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ForgeLogo } from '@/components/ForgeLogo';
import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  const t = useTranslations('auth');

  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('forgotPassword.heading')}</h1>
          <p className="text-sm text-text-primary mt-1">
            {t('forgotPassword.subheading')}
          </p>
        </div>

        {state && 'success' in state ? (
          <div className="space-y-4">
            <p className="text-sm text-accent">
              {t('forgotPassword.successMessage')}
            </p>
            <Link href="/login" className="block text-center text-sm text-text-primary hover:text-accent transition-colors">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-text-primary mb-1 block">
                {t('forgotPassword.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                className="bg-bg-page border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
              />
            </div>

            {state && 'error' in state && state.error && (
              <p className="text-sm text-error">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </button>

            <p className="text-center text-sm text-text-primary">
              <Link href="/login" className="text-accent hover:text-accent-hover">
                {t('forgotPassword.backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
