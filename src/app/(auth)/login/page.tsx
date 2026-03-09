import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  return (
    <div className="bg-white shadow-sm rounded-xl p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-gray-500">
        New here?{' '}
        <a href="/signup/trainer" className="text-blue-600 hover:underline">Trainer signup</a>
        {' '}·{' '}
        <a href="/signup/trainee" className="text-blue-600 hover:underline">Trainee signup</a>
      </p>
    </div>
  );
}
