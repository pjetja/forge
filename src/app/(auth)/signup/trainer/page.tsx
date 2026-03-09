import { SignupForm } from '@/components/auth/SignupForm';
import { signUpTrainer } from './actions';

export default function TrainerSignupPage() {
  return (
    <div className="bg-white shadow-sm rounded-xl p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create trainer account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your clients and create workout plans
        </p>
      </div>
      <SignupForm role="trainer" action={signUpTrainer} />
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
      </p>
    </div>
  );
}
