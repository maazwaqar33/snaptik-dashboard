import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: This middleware only checks for cookie *presence*, not token validity.
// Token signature and expiry are enforced server-side by the admin API on every request.
// Expired tokens will be caught by the 401 refresh logic in src/lib/api.ts.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/register-invite'];

// Allowed redirect targets to prevent open-redirect attacks
const isInternalPath = (path: string): boolean => {
  try {
    // Must be a relative path (no protocol/host)
    return path.startsWith('/') && !path.startsWith('//');
  } catch {
    return false;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow API routes and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for access token cookie (presence check — validity enforced by API)
  const token = request.cookies.get('admin_access_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Only set ?from= for safe internal paths to prevent open redirect
    if (isInternalPath(pathname) && pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
