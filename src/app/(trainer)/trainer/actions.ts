'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateInviteLink(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  const claimsError = claimsResult.error;

  if (claimsError || !claims) {
    return { error: 'Not authenticated' };
  }

  const trainerAuthUid = claims.sub;
  const token = crypto.randomUUID();
  const adminClient = createAdminClient();

  const { error: insertError } = await adminClient
    .from('invite_links')
    .insert({
      trainer_auth_uid: trainerAuthUid,
      token,
    });

  if (insertError) {
    return { error: 'Failed to generate invite link. Please try again.' };
  }

  // Return the full URL — use NEXT_PUBLIC_APP_URL if set, otherwise a relative path
  // The client component will prepend window.location.origin if needed
  return { url: `/join/${token}` };
}
