import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const t = await getTranslations('common');

  const adminClient = createAdminClient();

  // Step 1: Validate the invite token using admin client
  // (no public RLS read policy for invite_links — admin client required)
  const { data: invite, error: inviteError } = await adminClient
    .from('invite_links')
    .select('id, trainer_auth_uid, revoked_at')
    .eq('token', token)
    .single();

  if (inviteError || !invite || invite.revoked_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
        <div className="bg-bg-surface border border-border rounded-sm p-8 max-w-md w-full space-y-4">
          <div className="text-4xl text-center">🔗</div>
          <h1 className="text-xl font-bold text-text-primary text-center">{t('join.invalidHeading')}</h1>
          <p className="text-sm text-text-primary text-center">
            {t('join.invalidBody')}
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Check if trainee is logged in
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  if (!claims) {
    // Not logged in — send to trainee signup with invite token preserved
    redirect(`/signup/trainee?invite=${token}`);
  }

  const userUid = claims.sub;
  const userRole = claims.app_metadata?.role as string | undefined;

  // Step 3: Trainers should not claim invite links
  if (userRole === 'trainer') {
    redirect('/trainer');
  }

  // Step 4: Check for an existing connection for this trainee
  const { data: existing } = await adminClient
    .from('trainer_trainee_connections')
    .select('trainer_auth_uid')
    .eq('trainee_auth_uid', userUid)
    .single();

  if (existing) {
    if (existing.trainer_auth_uid === invite.trainer_auth_uid) {
      // Already connected to this trainer — idempotent success
      redirect('/trainee');
    }
    // Connected to a DIFFERENT trainer — show conflict screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
        <div className="bg-bg-surface border border-border rounded-sm p-8 max-w-md w-full space-y-4">
          <div className="text-4xl text-center">⚠️</div>
          <h1 className="text-xl font-bold text-text-primary text-center">{t('join.alreadyConnectedHeading')}</h1>
          <p className="text-sm text-text-primary text-center">
            {t('join.alreadyConnectedBody')}
          </p>
          <div className="text-center">
            <a
              href="/trainee"
              className="inline-block mt-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {t('join.goToDashboard')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: No existing connection — create it
  const { error: insertError } = await adminClient
    .from('trainer_trainee_connections')
    .insert({
      trainer_auth_uid: invite.trainer_auth_uid,
      trainee_auth_uid: userUid,
      invite_link_id: invite.id,
    });

  if (insertError) {
    // Unique constraint violation = race condition (two simultaneous claims) — treat as success
    // Any other error shows a friendly message
    const isUniqueViolation = insertError.code === '23505';
    if (!isUniqueViolation) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
          <div className="bg-bg-surface border border-border rounded-sm p-8 max-w-md w-full space-y-4">
            <div className="text-4xl text-center">❌</div>
            <h1 className="text-xl font-bold text-text-primary text-center">{t('join.connectionFailedHeading')}</h1>
            <p className="text-sm text-text-primary text-center">
              {t('join.connectionFailedBody')}
            </p>
          </div>
        </div>
      );
    }
  }

  // Successfully connected (or idempotent unique violation) — send to trainee home
  redirect('/trainee');
}
