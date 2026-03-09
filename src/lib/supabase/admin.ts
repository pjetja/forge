import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  // CRITICAL: Only use in Server Actions or Route Handlers.
  // This key has full database access and bypasses RLS.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
