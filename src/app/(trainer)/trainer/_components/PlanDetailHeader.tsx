'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlan, duplicatePlan, deletePlan } from '../plans/actions';

interface PlanDetailHeaderProps {
  planId: string;
  initialName: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
}

const IconCopy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

export function PlanDetailHeader({ planId, initialName, weekCount, workoutsPerWeek, assignedCount }: PlanDetailHeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialName);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleNameSave() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === name) { setEditingName(false); return; }
    setName(trimmed);
    setEditingName(false);
    startTransition(async () => { await updatePlan(planId, { name: trimmed }); });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicatePlan(planId, `Copy of ${name}`);
      if (!('error' in result)) router.push(`/trainer/plans/${result.planId}`);
    });
  }

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

  const iconBtn = 'p-2 text-text-primary opacity-50 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <a href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
          &larr; Plans
        </a>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleDuplicate} title="Duplicate plan" className={`${iconBtn} hover:text-accent`}>
            <IconCopy />
          </button>
          {confirmDelete ? (
            <>
              <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 cursor-pointer">
                {assignedCount > 0 ? 'Archive' : 'Delete'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-text-primary opacity-50 px-2 py-1.5 cursor-pointer">Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} title={assignedCount > 0 ? 'Archive plan' : 'Delete plan'} className={`${iconBtn} hover:text-red-400`}>
              <IconTrash />
            </button>
          )}
        </div>
      </div>

      {editingName ? (
        <input autoFocus type="text" value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
          className="text-2xl font-bold text-text-primary bg-bg-surface border border-accent rounded-sm px-2 py-0.5 w-full focus:outline-none"
        />
      ) : (
        <button type="button" onClick={() => { setNameDraft(name); setEditingName(true); }}
          title="Click to rename"
          className="text-left text-2xl font-bold text-text-primary hover:text-accent transition-colors cursor-text w-full">
          {name}
        </button>
      )}

      <p className="text-sm text-text-primary opacity-60">
        {weekCount} {weekCount === 1 ? 'week' : 'weeks'} &middot; {workoutsPerWeek} {workoutsPerWeek === 1 ? 'workout' : 'workouts'} per week
      </p>
    </div>
  );
}
