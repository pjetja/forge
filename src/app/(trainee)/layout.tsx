import { TraineeNavHeader } from './_components/TraineeNavHeader';

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page">
      <TraineeNavHeader />
      <main className="max-w-[1280px] mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
