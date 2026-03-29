'use client';
import { Suspense } from 'react';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { resendVerificationEmail } from './actions';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, action, pending] = useActionState(resendVerificationEmail, null);
  const t = useTranslations('auth');

  return (
    <div className="bg-bg-surface border border-border rounded-sm p-8 text-center space-y-4">
      <div className="text-4xl">📬</div>
      <h1 className="text-xl font-bold text-text-primary">{t('verifyEmail.heading')}</h1>
      <p className="text-sm text-text-primary">
        {t('verifyEmail.body', { emailSuffix: email ? t('verifyEmail.toEmail', { email }) : t('verifyEmail.toAddress') })}
      </p>
      <p className="text-xs text-text-primary">
        {t('verifyEmail.notReceived')}
      </p>

      {email && (
        <form action={action} className="pt-2">
          <input type="hidden" name="email" value={email} />
          {state && 'success' in state && state.success && (
            <p className="text-sm text-accent mb-2">{t('verifyEmail.resendSuccess')}</p>
          )}
          {state && 'error' in state && state.error && (
            <p className="text-sm text-white bg-error/10 border border-error/30 rounded-sm px-3 py-2 mb-2">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-accent hover:text-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {pending ? t('verifyEmail.resending') : t('verifyEmail.resend')}
          </button>
        </form>
      )}
    </div>
  );
}

function VerifyEmailFallback() {
  const t = useTranslations('auth');
  return (
    <div className="bg-bg-surface border border-border rounded-sm p-8 text-center text-text-primary">
      {t('verifyEmail.loading')}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
