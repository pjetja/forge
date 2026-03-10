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

  return (
    <>
      <div className="flex justify-center mb-8">
        <ForgeLogo variant="horizontal" className="h-10" />
      </div>
      <div className="bg-bg-surface border border-border rounded-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Create trainee account</h1>
        <p className="text-sm text-text-primary mt-1">
          Track your workouts and stay connected with your trainer
        </p>
      </div>
      <SignupForm role="trainee" action={signUpTrainee} inviteToken={inviteToken} />
      <p className="text-center text-sm text-text-primary">
        Already have an account?{' '}
        <a href="/login" className="text-accent hover:text-accent-hover">Sign in</a>
      </p>
      </div>
    </>
  );
}
