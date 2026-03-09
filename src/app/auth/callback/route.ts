import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') as 'trainer' | 'trainee' | null;
  const inviteToken = searchParams.get('invite');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const existingRole = data.user.app_metadata?.role as 'trainer' | 'trainee' | undefined;

  // Only assign role on FIRST OAuth signup (new user has no existing role)
  if (!existingRole && role) {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role },
    });

    // Create profile row for new OAuth user
    if (role === 'trainer') {
      await supabase.from('trainers').insert({
        auth_uid: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ?? data.user.email ?? 'Trainer',
      });
    } else {
      await supabase.from('users').insert({
        auth_uid: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ?? data.user.email ?? 'Trainee',
        role: 'trainee',
      });

      // Auto-connect to trainer if invite token was preserved through OAuth redirect
      if (inviteToken) {
        const adminClient = createAdminClient();
        await claimInviteToken(adminClient, data.user.id, inviteToken);
      }
    }
  }

  // Use existingRole if present (returning user), otherwise the newly assigned role
  const finalRole = (existingRole ?? role) as 'trainer' | 'trainee' | undefined;

  if (!finalRole) {
    // OAuth login on main /login page for a user with no role — shouldn't happen in production
    // but handle gracefully
    return NextResponse.redirect(`${origin}/login?error=no_role`);
  }

  const destination = finalRole === 'trainer' ? '/trainer' : '/trainee';
  return NextResponse.redirect(`${origin}${destination}`);
}

// Helper: claim an invite link for a newly signed-up trainee
// Uses admin client to bypass RLS — insert into trainer_trainee_connections
async function claimInviteToken(
  adminClient: ReturnType<typeof createAdminClient>,
  traineeUid: string,
  token: string
) {
  try {
    const { data: invite } = await adminClient
      .from('invite_links')
      .select('id, trainer_auth_uid, revoked_at')
      .eq('token', token)
      .single();

    if (!invite || invite.revoked_at) return; // invalid or revoked

    await adminClient.from('trainer_trainee_connections').insert({
      trainer_auth_uid: invite.trainer_auth_uid,
      trainee_auth_uid: traineeUid,
      invite_link_id: invite.id,
    });
  } catch (err) {
    // Unique constraint violation = already connected — ignore
    console.error('Invite claim failed (may already be connected):', err);
  }
}
