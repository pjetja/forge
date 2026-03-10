import { ForgeLogo } from '@/components/ForgeLogo';
import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Sign in</h1>
        <p className="text-sm text-text-primary mt-1">Welcome back</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-text-primary">
        New here?{' '}
        <a href="/signup/trainer" className="text-accent hover:text-accent-hover">Trainer signup</a>
        {' '}·{' '}
        <a href="/signup/trainee" className="text-accent hover:text-accent-hover">Trainee signup</a>
      </p>
      </div>
    </>
  );
}
