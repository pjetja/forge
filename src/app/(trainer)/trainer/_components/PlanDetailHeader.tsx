'use client';
import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlan, duplicatePlan, deletePlan } from '../plans/actions';

interface PlanDetailHeaderProps {
  planId: string;
  initialName: string;
  weekCount: number;
  workoutsPerWeek: number;
  initialTags: string[];
  assignedCount: number;
  hasMeta: boolean; // false = migration 0004 not applied
}

export function PlanDetailHeader({
  planId, initialName, weekCount, workoutsPerWeek, initialTags, assignedCount, hasMeta,
}: PlanDetailHeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Name editing
  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialName);

  function handleNameSave() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === name) { setEditingName(false); return; }
    setName(trimmed);
    setEditingName(false);
    startTransition(async () => { await updatePlan(planId, { name: trimmed }); });
  }

  // Tags editing
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      const next = [...tags, tag];
      setTags(next);
      startTransition(async () => { await updatePlan(planId, { tags: next }); });
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    startTransition(async () => { await updatePlan(planId, { tags: next }); });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) removeTag(tags[tags.length - 1]);
  }

  // Duplicate
  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicatePlan(planId, `Copy of ${name}`);
      if (!('error' in result)) router.push(`/trainer/plans/${result.planId}`);
    });
  }

  // Delete / archive
  const [confirmDelete, setConfirmDelete] = useState(false);
  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlan(planId);
      if (!('error' in result)) {
        if (result.archived) alert(`"${name}" archived — trainees keep access.`);
        router.push('/trainer/plans');
      }
      setConfirmDelete(false);
    });
  }

  return (
    <div className="space-y-3">
      {/* Back + action row */}
      <div className="flex items-center justify-between gap-2">
        <a href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
          &larr; Plans
        </a>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDuplicate}
            title="Duplicate plan"
            className="p-1.5 text-text-primary opacity-50 hover:opacity-100 hover:text-accent transition-opacity cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          {confirmDelete ? (
            <>
              <button type="button" onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 cursor-pointer">
                {assignedCount > 0 ? 'Archive' : 'Delete'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="text-xs text-text-primary opacity-50 px-2 py-1 cursor-pointer">Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}
              title={assignedCount > 0 ? 'Archive plan' : 'Delete plan'}
              className="p-1.5 text-text-primary opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Editable name */}
      {editingName ? (
        <input
          autoFocus
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
          className="text-2xl font-bold text-text-primary bg-bg-surface border border-accent rounded-sm px-2 py-0.5 w-full focus:outline-none"
        />
      ) : (
        <button type="button" onClick={() => { setNameDraft(name); setEditingName(true); }}
          className="text-left text-2xl font-bold text-text-primary hover:text-accent transition-colors cursor-text w-full">
          {name}
        </button>
      )}

      <p className="text-sm text-text-primary opacity-60">
        {weekCount}w &middot; {workoutsPerWeek}x/week
      </p>

      {/* Tags editor — only when migration 0004 is applied */}
      {hasMeta && (
        <div>
          <div
            className="flex flex-wrap gap-1.5 p-2 bg-bg-surface border border-border rounded-sm focus-within:border-accent cursor-text min-h-[36px]"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-bg-page border border-border text-text-primary">
                {tag}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                  className="opacity-60 hover:opacity-100 cursor-pointer leading-none">&times;</button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag(tagInput)}
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
              className="flex-1 min-w-[80px] bg-transparent text-xs text-text-primary focus:outline-none placeholder:text-text-primary/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
