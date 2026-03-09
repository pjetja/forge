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
    <div className="bg-white shadow-sm rounded-xl p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create trainee account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your workouts and stay connected with your trainer
        </p>
      </div>
      <SignupForm role="trainee" action={signUpTrainee} inviteToken={inviteToken} />
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
      </p>
    </div>
  );
}
