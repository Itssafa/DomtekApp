import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_KEY = 'domtek_token';

const NON_ORG_SEGMENTS = new Set([
  '', 'login', 'register', 'admin', 'en-attente',
  'annonces', 'organisations', 'paiement', 'api',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token        = request.cookies.get(TOKEN_KEY)?.value;
  const orgSlug      = request.cookies.get('org-slug')?.value;
  const firstSegment = pathname.split('/')[1] ?? '';

  // ── Routes publiques ───────────────────────────────────────────────────────
  const PUBLIC_PREFIXES = ['/login', '/register', '/annonces', '/organisations', '/en-attente', '/paiement', '/forgot-password', '/reset-password', '/auth/google', '/verify-email'];
  const isPublic = pathname === '/' || PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isPublic) {
    // Déjà connecté avec un org-slug connu → rediriger vers l'espace org
    if (token && orgSlug && (pathname === '/login' || pathname.startsWith('/register'))) {
      return NextResponse.redirect(new URL(`/${orgSlug}`, request.url));
    }
    return NextResponse.next();
  }

  // ── Routes protégées : token requis ──────────────────────────────────────
  if (!NON_ORG_SEGMENTS.has(firstSegment) || firstSegment === '') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
