'use client';
import Link from 'next/link';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { duplicatePlan, deletePlan } from '../plans/actions';
import { useRouter } from 'next/navigation';

interface PlanCardProps {
  id: string;
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
  tags: string[];
}

// Simple inline SVG icons
const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export function PlanCard({ id, name, weekCount, workoutsPerWeek, assignedCount, tags }: PlanCardProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await duplicatePlan(id, t('plans.copyOf', { name }));
      if (!('error' in result)) router.push(`/trainer/plans/${result.planId}`);
    });
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(true);
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await deletePlan(id);
      if (!('error' in result)) {
        if (result.archived) {
          alert(`"${name}" archived — trainees keep access, but it's hidden from your list.`);
        }
        router.refresh();
      }
      setConfirmDelete(false);
    });
  }

  function handleDeleteCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  }

  return (
    <Link
      href={`/trainer/plans/${id}`}
      className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary truncate">{name}</p>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
          <span className="text-sm text-text-primary opacity-60 whitespace-nowrap">
            {weekCount} {weekCount === 1 ? t('plans.weekSingular') : t('plans.weekPlural')} &middot; {workoutsPerWeek} {workoutsPerWeek === 1 ? t('plans.workoutSingular') : t('plans.workoutPlural')} {t('plans.perWeek')}
            {assignedCount > 0 && <> &middot; {assignedCount} {assignedCount !== 1 ? t('plans.traineePlural') : t('plans.traineeSingular')}</>}
          </span>
          {tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-full text-xs bg-bg-page border border-border text-text-primary flex-shrink-0">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-3">
        {confirmDelete ? (
          <>
            <button type="button" onClick={handleDeleteConfirm} disabled={isPending}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 cursor-pointer disabled:opacity-30">
              {isPending ? '…' : assignedCount > 0 ? t('plans.archive') : tc('button.delete')}
            </button>
            <button type="button" onClick={handleDeleteCancel}
              className="text-xs text-text-primary opacity-50 hover:opacity-100 px-2 py-1 cursor-pointer">
              {tc('button.cancel')}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={handleDuplicate} disabled={isPending}
              title={t('plans.duplicatePlan')}
              className="p-1.5 text-text-primary opacity-40 hover:opacity-100 hover:text-accent transition-opacity cursor-pointer disabled:opacity-20">
              {isPending ? '…' : <IconCopy />}
            </button>
            <button type="button" onClick={handleDeleteClick} disabled={isPending}
              title={assignedCount > 0 ? t('plans.archivePlan') : t('plans.deletePlan')}
              className="p-1.5 text-text-primary opacity-40 hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-20">
              <IconTrash />
            </button>
            <span className="text-text-primary opacity-40 ml-1"><IconChevron /></span>
          </>
        )}
      </div>
    </Link>
  );
}
