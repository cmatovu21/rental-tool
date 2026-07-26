import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt';

const STAFF_ROLES = ['LANDLORD', 'CARETAKER', 'ACCOUNTANT'];
const PROPERTY_MANAGERS = ['LANDLORD', 'CARETAKER'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/accept-invite'];

function roleHome(role: string) {
  return role === 'TENANT' ? '/portal' : '/dashboard';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Signed-in users don't need the login/register/etc. screens again.
  if (isAuthPath && session) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  if (pathname.startsWith('/portal')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (session.role !== 'TENANT') return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!STAFF_ROLES.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
    if (pathname.startsWith('/settings/users') && session.role !== 'LANDLORD') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Property Module (Milestone 5): Landlord + Caretaker only. Accountant
  // isn't part of this module's scope (see the Screen List doc) and gets
  // redirected to their own dashboard, same as Tenant would.
  if (pathname.startsWith('/properties') || pathname.startsWith('/units')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!PROPERTY_MANAGERS.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  // Tenant Module (Milestone 6): all three staff roles can view (Accountant
  // is read-only — enforced in the API routes, not here); Tenant is not.
  if (pathname.startsWith('/tenants')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!STAFF_ROLES.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  // Payment Module (Milestone 7): all three staff roles; refunds are further
  // restricted to Landlord/Accountant at the API level, not here.
  if (pathname.startsWith('/payments')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!STAFF_ROLES.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  // Reminder Engine (Milestone 8): all three staff roles can view; only
  // Landlord can trigger a manual run or edit templates (API-level check).
  if (pathname.startsWith('/reminders')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!STAFF_ROLES.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  // Maintenance (Milestone 9): staff view/manage tickets here; tenants use
  // /portal/maintenance instead (covered by the /portal check above).
  if (pathname.startsWith('/maintenance')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!STAFF_ROLES.includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  // Reports (Milestone 10): Landlord + Accountant only — matches the
  // Screen List doc and the API-level role check.
  if (pathname.startsWith('/reports')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!['LANDLORD', 'ACCOUNTANT'].includes(session.role)) return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/settings/:path*',
    '/properties/:path*',
    '/units/:path*',
    '/tenants/:path*',
    '/payments/:path*',
    '/reminders/:path*',
    '/maintenance/:path*',
    '/reports/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/accept-invite',
  ],
};
