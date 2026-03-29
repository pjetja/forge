'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { ForgeLogo } from '@/components/ForgeLogo';
import { updatePassword } from './actions';

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, null);
  const t = useTranslations('auth');

  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('resetPassword.heading')}</h1>
          <p className="text-sm text-text-primary mt-1">{t('resetPassword.subheading')}</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm text-text-primary mb-1 block">
              {t('resetPassword.newPasswordLabel')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-bg-page border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="text-sm text-text-primary mb-1 block">
              {t('resetPassword.confirmLabel')}
            </label>
            <input
              id="confirm"
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
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
            {pending ? t('resetPassword.submitting') : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </>
  );
}
