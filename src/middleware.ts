// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and API routes
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') ||
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/protocol-overview') {
    return NextResponse.next();
  }

  // For Firebase auth, we rely on client-side redirects in components
  // since auth state can't be checked in middleware
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
