'use client';
import { Suspense } from 'react';
import { useActionState } from 'react';
import { resendVerificationEmail } from './actions';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, action, pending] = useActionState(resendVerificationEmail, null);

  return (
    <div className="bg-bg-surface border border-border rounded-sm p-8 text-center space-y-4">
      <div className="text-4xl">📬</div>
      <h1 className="text-xl font-bold text-text-primary">Check your inbox</h1>
      <p className="text-sm text-text-primary">
        We sent a verification link{email ? ` to ${email}` : ' to your email address'}. Click it to activate your account.
      </p>
      <p className="text-xs text-text-primary">
        {"Didn't receive it? Check your spam folder. The link expires after 24 hours."}
      </p>

      {email && (
        <form action={action} className="pt-2">
          <input type="hidden" name="email" value={email} />
          {state && 'success' in state && state.success && (
            <p className="text-sm text-accent mb-2">Verification email resent!</p>
          )}
          {state && 'error' in state && state.error && (
            <p className="text-sm text-white bg-error/10 border border-error/30 rounded-sm px-3 py-2 mb-2">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-accent hover:text-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {pending ? 'Sending…' : 'Resend verification email'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-bg-surface border border-border rounded-sm p-8 text-center text-text-primary">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
