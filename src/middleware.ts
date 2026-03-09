import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Must create a new response first so we can mutate cookies for token refresh
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens to the response — this is what enables silent refresh
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims(): validates JWT signature locally using WebCrypto
  // Only hits Supabase network if session is near expiry (refresh needed)
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  const error = claimsResult.error;

  const path = request.nextUrl.pathname;

  // Public paths — no auth required
  const publicPaths = ['/login', '/signup', '/auth', '/join', '/verify-email', '/invite-invalid'];
  const isPublic = publicPaths.some(p => path.startsWith(p));

  // Not authenticated
  if (!claims || error) {
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Email verification gate — block unverified users from accessing the app
  if (!claims.email_confirmed_at && !isPublic) {
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  const role = claims.app_metadata?.role as 'trainer' | 'trainee' | undefined;

  // Cross-role access prevention
  if (role === 'trainee' && path.startsWith('/trainer')) {
    return NextResponse.redirect(new URL('/trainee', request.url));
  }
  if (role === 'trainer' && path.startsWith('/trainee')) {
    return NextResponse.redirect(new URL('/trainer', request.url));
  }

  // Authenticated users visiting /login or /signup — redirect to their home
  if ((path === '/login' || path === '/') && role) {
    const home = role === 'trainer' ? '/trainer' : '/trainee';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return response;
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
