'use client';
import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPlan } from '../actions';

export default function NewPlanPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string).trim();
    const weekCount = parseInt(data.get('weekCount') as string, 10);
    const workoutsPerWeek = parseInt(data.get('workoutsPerWeek') as string, 10);
    const notes = (data.get('notes') as string).trim() || undefined;

    // Flush any pending tag input
    const finalTags = tagInput.trim()
      ? [...tags, ...tagInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)].filter(
          (t, i, arr) => arr.indexOf(t) === i
        )
      : tags;

    if (!name || isNaN(weekCount) || isNaN(workoutsPerWeek)) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createPlan({ name, weekCount, workoutsPerWeek, tags: finalTags, notes });
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/trainer/plans/${result.planId}`);
      }
    });
  }

  const inputClass = 'w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary placeholder:text-text-primary/50 focus:border-accent focus:outline-none text-sm';

  return (
    <div className="max-w-md space-y-6">
      <div>
        <a href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
          &larr; Plans
        </a>
        <h1 className="text-2xl font-bold text-text-primary mt-2">New plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
            Plan name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. 8-Week Hypertrophy"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weekCount" className="block text-sm font-medium text-text-primary mb-1">
              Number of weeks
            </label>
            <input
              id="weekCount"
              name="weekCount"
              type="number"
              required
              min={1}
              max={52}
              defaultValue={8}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="workoutsPerWeek" className="block text-sm font-medium text-text-primary mb-1">
              Workouts per week
            </label>
            <input
              id="workoutsPerWeek"
              name="workoutsPerWeek"
              type="number"
              required
              min={1}
              max={7}
              defaultValue={4}
              className={inputClass}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Tags <span className="font-normal opacity-60">(optional)</span>
          </label>
          <div
            className="flex flex-wrap gap-1.5 p-2 bg-bg-surface border border-border rounded-sm focus-within:border-accent cursor-text min-h-[40px]"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-bg-page border border-border text-text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  className="opacity-60 hover:opacity-100 cursor-pointer leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag(tagInput)}
              placeholder={tags.length === 0 ? 'e.g. strength, hypertrophy...' : ''}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-text-primary focus:outline-none placeholder:text-text-primary/40"
            />
          </div>
          <p className="mt-1 text-xs text-text-primary opacity-50">Press Enter or comma to add a tag</p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-1">
            Notes <span className="font-normal opacity-60">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Training goals, equipment needed, special instructions..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <p className="text-sm text-white bg-error/10 border border-error/30 rounded-sm px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-sm py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {isPending ? 'Creating...' : 'Create plan'}
        </button>
      </form>
    </div>
  );
}
