import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const role = searchParams.get('role') as 'trainer' | 'trainee' | null;
  const inviteToken = searchParams.get('invite');

  // Collect cookies here so we can write them directly onto the redirect response.
  // Using cookies() from next/headers does NOT attach cookies to NextResponse.redirect().
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(incoming) { cookiesToSet.push(...incoming); },
      },
    }
  );

  const adminClient = createAdminClient();
  let user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null = null;

  if (tokenHash && type) {
    // Email confirmation (token_hash flow)
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' });
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
    user = data.user;
  } else if (code) {
    // PKCE code exchange (email confirmation + Google OAuth)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
    user = data.user;
  } else {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const existingRole = user.app_metadata?.role as 'trainer' | 'trainee' | undefined;

  // Only assign role and create profile on first signup (no existing role)
  if (!existingRole && role) {
    await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: { role },
    });

    // Use admin client for profile insert — no session exists yet at this point
    // (email just confirmed, RLS would block a regular client insert)
    if (role === 'trainer') {
      await adminClient.from('trainers').insert({
        auth_uid: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Trainer',
      });
    } else {
      await adminClient.from('users').insert({
        auth_uid: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Trainee',
        role: 'trainee',
      });

      if (inviteToken) {
        await claimInviteToken(adminClient, user.id, inviteToken);
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
  const response = NextResponse.redirect(`${origin}${destination}`);

  // Write session cookies directly onto the redirect response so the browser receives them.
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}

// Helper: claim an invite link for a newly signed-up trainee
// Uses admin client to bypass RLS — insert into trainer_trainee_connections
async function claimInviteToken(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
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
