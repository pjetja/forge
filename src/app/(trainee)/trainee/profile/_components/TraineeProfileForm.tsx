'use client';
import { useTransition, useState, useEffect } from 'react';
import { updateTraineeProfile } from '../actions';

export function TraineeProfileForm({
  initialName,
  initialGoals,
  initialHeightCm,
  initialWeightKg,
  initialDateOfBirth,
}: {
  initialName: string;
  initialGoals: string;
  initialHeightCm: number | null;
  initialWeightKg: number | null;
  initialDateOfBirth: string | null; // 'YYYY-MM-DD' or null
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateTraineeProfile(formData);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="text-sm text-text-primary mb-1 block">
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
        />
      </div>

      <div>
        <label htmlFor="profile-goals" className="text-sm text-text-primary mb-1 block">
          Goals
        </label>
        <textarea
          id="profile-goals"
          name="goals"
          rows={4}
          defaultValue={initialGoals}
          placeholder="e.g. lose 10kg by summer, improve squat"
          className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="profile-height" className="text-sm text-text-primary mb-1 block">
            Height (cm)
          </label>
          <input
            id="profile-height"
            type="number"
            name="heightCm"
            min="50"
            max="300"
            step="1"
            defaultValue={initialHeightCm ?? undefined}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>

        <div>
          <label htmlFor="profile-weight" className="text-sm text-text-primary mb-1 block">
            Weight (kg)
          </label>
          <input
            id="profile-weight"
            type="number"
            name="weightKg"
            min="20"
            max="500"
            step="0.1"
            defaultValue={initialWeightKg ?? undefined}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>

        <div>
          <label htmlFor="profile-dob" className="text-sm text-text-primary mb-1 block">
            Date of birth
          </label>
          <input
            id="profile-dob"
            type="date"
            name="dateOfBirth"
            defaultValue={initialDateOfBirth ?? undefined}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto"
        >
          {isPending ? 'Saving...' : 'Save changes'}
        </button>

        {success && (
          <p className="text-accent text-sm mt-2">Changes saved.</p>
        )}
        {error && (
          <p className="text-error text-sm mt-2">{error}</p>
        )}
      </div>
    </form>
  );
}
