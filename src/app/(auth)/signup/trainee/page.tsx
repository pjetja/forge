import { getTranslations } from 'next-intl/server';
import { ForgeLogo } from '@/components/ForgeLogo';
import { SignupForm } from '@/components/auth/SignupForm';
import { signUpTrainee } from './actions';

export default function TraineeSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  return (
    <TraineeSignupContent searchParams={searchParams} />
  );
}

async function TraineeSignupContent({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite;
  const t = await getTranslations('auth');

  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('signup.traineeHeading')}</h1>
        <p className="text-sm text-text-primary mt-1">
          {t('signup.traineeSubheading')}
        </p>
      </div>
      <SignupForm role="trainee" action={signUpTrainee} inviteToken={inviteToken} />
      <p className="text-center text-sm text-text-primary">
        {t('signup.hasAccount')}{' '}
        <a href="/login" className="text-accent hover:text-accent-hover">{t('signup.loginLink')}</a>
      </p>
      </div>
    </>
  );
}
