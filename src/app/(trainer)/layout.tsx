import { NavHeader } from './_components/NavHeader';
import { createClient } from '@/lib/supabase/server';
import { gravatarUrl } from '@/lib/gravatar';
import { getLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/constants';

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  const email = (claims?.email as string) ?? '';
  const avatarUrl = email ? gravatarUrl(email) : '';
  const locale = await getLocale() as Locale;

  let trainerName = '';
  if (claims?.sub) {
    const { data: trainer } = await supabase
      .from('trainers')
      .select('name')
      .eq('auth_uid', claims.sub)
      .single();
    trainerName = trainer?.name ?? '';
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <NavHeader avatarUrl={avatarUrl} userName={trainerName} locale={locale} />
      <main className="max-w-[1280px] mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
