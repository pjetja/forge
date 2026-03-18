'use client';
import { useTransition, useState, useEffect } from 'react';
import { updateTrainerProfile } from '../actions';

export function TrainerProfileForm({
  initialName,
  initialBio,
}: {
  initialName: string;
  initialBio: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
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
      const result = await updateTrainerProfile(formData);
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
        <label htmlFor="profile-bio" className="text-sm text-text-primary mb-1 block">
          Bio
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
        />
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
