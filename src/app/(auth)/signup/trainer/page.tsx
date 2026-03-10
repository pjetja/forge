import { ForgeLogo } from '@/components/ForgeLogo';
import { SignupForm } from '@/components/auth/SignupForm';
import { signUpTrainer } from './actions';

export default function TrainerSignupPage() {
  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Create trainer account</h1>
        <p className="text-sm text-text-primary mt-1">
          Manage your clients and create workout plans
        </p>
      </div>
      <SignupForm role="trainer" action={signUpTrainer} />
      <p className="text-center text-sm text-text-primary">
        Already have an account?{' '}
        <a href="/login" className="text-accent hover:text-accent-hover">Sign in</a>
      </p>
      </div>
    </>
  );
}
