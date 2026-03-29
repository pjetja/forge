import { TraineeNavHeader } from './_components/TraineeNavHeader';
import { createClient } from '@/lib/supabase/server';
import { gravatarUrl } from '@/lib/gravatar';

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  const email = (claims?.email as string) ?? '';
  const avatarUrl = email ? gravatarUrl(email) : '';

  let userName = '';
  if (claims?.sub) {
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('auth_uid', claims.sub)
      .single();
    userName = user?.name ?? '';
  }

  return (
    <div className="min-h-screen min-w-[768px] bg-bg-page">
      <TraineeNavHeader avatarUrl={avatarUrl} userName={userName} />
      <main className="max-w-[1280px] mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
