export default function TraineeHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Your Training</h1>
      <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
        <div className="text-4xl">🏋️</div>
        <h2 className="font-medium text-text-primary">Waiting for your trainer</h2>
        <p className="text-sm text-text-primary max-w-xs mx-auto">
          Your trainer will assign a workout plan shortly. Once assigned, your schedule will appear here.
        </p>
      </div>
    </div>
  );
}
