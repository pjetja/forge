export default function TraineeHomeLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* In-progress session banner placeholder */}
      <div className="h-12 bg-border rounded" />

      {/* Tab switcher placeholder */}
      <div className="flex gap-4 border-b border-border pb-2">
        <div className="h-8 w-16 bg-border rounded" />
        <div className="h-8 w-10 bg-border rounded" />
        <div className="h-8 w-20 bg-border rounded" />
        <div className="h-8 w-24 bg-border rounded" />
      </div>

      {/* Plan cards placeholder */}
      <div className="space-y-3">
        <div className="h-20 bg-border rounded" />
        <div className="h-20 bg-border rounded" />
        <div className="h-20 bg-border rounded" />
      </div>
    </div>
  );
}
