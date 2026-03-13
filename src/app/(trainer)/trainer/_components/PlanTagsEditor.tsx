'use client';
import { useState, useTransition } from 'react';
import { updatePlan } from '../plans/actions';

interface PlanTagsEditorProps {
  planId: string;
  initialTags: string[];
}

export function PlanTagsEditor({ planId, initialTags }: PlanTagsEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');
  const [, startTransition] = useTransition();

  function saveTags(updated: string[]) {
    startTransition(async () => {
      await updatePlan(planId, { tags: updated });
    });
  }

  function addTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    const updated = [...tags, tag];
    setTags(updated);
    setInput('');
    saveTags(updated);
  }

  function removeTag(tag: string) {
    const updated = tags.filter((t) => t !== tag);
    setTags(updated);
    saveTags(updated);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-text-primary">Tags</label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-bg-surface border border-border rounded-sm min-h-[40px] focus-within:border-accent transition-colors cursor-text">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-bg-page border border-border text-text-primary flex-shrink-0">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              title={`Remove tag "${tag}"`}
              className="text-text-primary opacity-50 hover:opacity-100 cursor-pointer leading-none"
              aria-label={`Remove tag ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-text-primary placeholder:text-text-primary/40 focus:outline-none"
        />
      </div>
      <p className="text-xs text-text-primary opacity-40">Enter or comma to add · Backspace to remove last</p>
    </div>
  );
}
