import { getTranslations } from 'next-intl/server';
import { ForgeLogo } from '@/components/ForgeLogo';
import { LoginForm } from './_components/LoginForm';

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('login.heading')}</h1>
        <p className="text-sm text-text-primary mt-1">{t('login.subheading')}</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-text-primary">
        <a href="/forgot-password" className="text-accent hover:text-accent-hover">{t('login.forgotPassword')}</a>
      </p>
      <p className="text-center text-sm text-text-primary">
        {t('login.newHere')}{' '}
        <a href="/signup/trainer" className="text-accent hover:text-accent-hover">{t('login.trainerSignup')}</a>
        {' '}·{' '}
        <a href="/signup/trainee" className="text-accent hover:text-accent-hover">{t('login.traineeSignup')}</a>
      </p>
      </div>
    </>
  );
}
