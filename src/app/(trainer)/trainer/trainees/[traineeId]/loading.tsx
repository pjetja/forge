export default function TraineeDetailLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Trainee header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-border shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-border rounded" />
          <div className="h-4 w-28 bg-border rounded" />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-4 border-b border-border pb-2">
        <div className="h-8 w-16 bg-border rounded" />
        <div className="h-8 w-20 bg-border rounded" />
        <div className="h-8 w-14 bg-border rounded" />
        <div className="h-8 w-16 bg-border rounded" />
        <div className="h-8 w-24 bg-border rounded" />
      </div>

      {/* Content area */}
      <div className="space-y-3">
        <div className="h-20 bg-border rounded" />
        <div className="h-20 bg-border rounded" />
        <div className="h-20 bg-border rounded" />
      </div>
    </div>
  );
}
