import { getTranslations } from 'next-intl/server';
import { GravatarAvatar } from '@/components/GravatarAvatar';

interface TrainerCardProps {
  trainer: {
    name: string;
    email: string;
    bio: string | null;
    avatarUrl: string;
  };
}

export async function TrainerCard({ trainer }: TrainerCardProps) {
  const t = await getTranslations('trainee');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary">{t('profile.myTrainerHeading')}</h2>
      <div className="bg-bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <GravatarAvatar url={trainer.avatarUrl} name={trainer.name} size={40} />
          <div>
            <p className="font-medium text-text-primary">{trainer.name}</p>
            <p className="text-sm text-text-primary opacity-50">{trainer.email}</p>
          </div>
        </div>
        {trainer.bio && (
          <p className="text-text-primary mt-4">{trainer.bio}</p>
        )}
      </div>
    </div>
  );
}
