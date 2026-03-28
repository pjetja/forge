import Link from 'next/link';

export default function HelpPage() {
  return (
    <main className="bg-bg-page min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Page heading */}
        <h1 className="text-2xl font-bold text-text-primary mb-8">Help &amp; FAQ</h1>

        {/* Back to home link for unauthenticated users */}
        <Link href="/" className="text-sm text-accent hover:text-accent-hover transition-colors mb-8 inline-block">&larr; Back to home</Link>

        {/* For Trainers section */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">For Trainers</h2>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">How do I create a workout plan?</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>Go to the Plans tab and click &apos;New Plan&apos;. Give your plan a name and set the number of weeks. Then add workout schemas (like &apos;Push Day&apos; or &apos;Pull Day&apos;) to each week. Inside each schema, add exercises from your library with the target sets, reps, and weight.</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">How do I assign a plan to a trainee?</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>Open any plan and click &apos;Assign&apos;. Select a trainee from your connected roster. Review the exercise weights and adjust if needed for that specific trainee. Once assigned, the trainee will see their scheduled workouts immediately.</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">How do I view a trainee&apos;s progress?</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>Go to the Trainees tab and click on any trainee&apos;s name. You&apos;ll see their workout history with every session, exercise, and the sets, reps, and weights they actually logged. Use the Exercises tab to see cross-plan progress charts for individual exercises.</p>
          </div>
        </section>

        {/* For Trainees section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">For Trainees</h2>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">How do I join a trainer?</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>Your trainer will send you an invite link or code. Click the link or enter the code on the join page. Once connected, you&apos;ll see the workout plans your trainer assigns to you.</p>
            <hr className="border-border" />
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-text-primary mb-2">How do I log a workout?</h3>
            <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>Open your current plan from the Plans tab. Tap the workout scheduled for today to start a session. For each exercise, you&apos;ll see last week&apos;s results inline. Enter your actual weight, reps, and sets for each exercise. Tap &apos;Finish Workout&apos; when you&apos;re done.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
