import { signOut } from '@/app/(auth)/login/actions';

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="bg-bg-page border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-accent text-lg">⚡ Forge</span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-text-primary hover:text-accent transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
