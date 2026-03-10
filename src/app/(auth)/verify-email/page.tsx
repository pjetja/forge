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
    <div className="bg-white shadow-sm rounded-xl p-8 text-center space-y-4">
      <div className="text-4xl">📬</div>
      <h1 className="text-xl font-semibold">Check your inbox</h1>
      <p className="text-sm text-gray-500">
        We sent a verification link{email ? ` to ${email}` : ' to your email address'}. Click it to activate your account.
      </p>
      <p className="text-xs text-gray-400">
        {"Didn't receive it? Check your spam folder. The link expires after 24 hours."}
      </p>

      {email && (
        <form action={action} className="pt-2">
          <input type="hidden" name="email" value={email} />
          {state && 'success' in state && state.success && (
            <p className="text-sm text-green-600 mb-2">Verification email resent!</p>
          )}
          {state && 'error' in state && state.error && (
            <p className="text-sm text-red-500 mb-2">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
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
    <Suspense fallback={<div className="bg-white shadow-sm rounded-xl p-8 text-center">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
