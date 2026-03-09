export default function VerifyEmailPage() {
  return (
    <div className="bg-white shadow-sm rounded-xl p-8 text-center space-y-4">
      <div className="text-4xl">📬</div>
      <h1 className="text-xl font-semibold">Check your inbox</h1>
      <p className="text-sm text-gray-500">
        We sent a verification link to your email address. Click it to activate your account.
      </p>
      <p className="text-xs text-gray-400">
        {"Didn't receive it? Check your spam folder. The link expires after 24 hours."}
      </p>
    </div>
  );
}
