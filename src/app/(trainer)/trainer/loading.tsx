export default function TrainerHomeLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Page heading + invite button row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-border rounded" />
        <div className="h-9 w-28 bg-border rounded" />
      </div>

      {/* Trainee roster cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-bg-surface border border-border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-border shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-border rounded" />
              <div className="h-3 w-24 bg-border rounded" />
            </div>
            <div className="h-6 w-20 bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
