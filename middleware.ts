import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for auth routes to prevent redirect loops
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }
  
  // For now, let the client-side auth provider handle authentication
  // This prevents the mismatch between server-side and client-side session validation
  // The auth provider will handle redirects appropriately
  
  // Check if user is trying to access protected routes
  const protectedRoutes = ['/polls/create', '/dashboard', '/settings', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Let the client-side auth provider handle authentication
    // This prevents server/client session validation mismatches
    return res;
  }

  return res
}

export const config = {
  matcher: [
    '/polls/create',
    '/dashboard/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}