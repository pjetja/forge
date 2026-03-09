export default function TrainerHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your Trainees</h1>
        {/* Plan 04 will replace this with a functional invite button */}
        <button
          disabled
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
        >
          + Invite trainee
        </button>
      </div>

      {/* Empty state — Plan 04 replaces this with the real roster */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
        <div className="text-4xl text-gray-300">👥</div>
        <h2 className="font-medium text-gray-700">No trainees yet</h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Invite your first client to get started. {"They'll"} receive a link to join your roster.
        </p>
      </div>
    </div>
  );
}
