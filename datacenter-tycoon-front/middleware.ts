import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/welcome', '/auth/login', '/auth/register', '/auth/forgot-password', '/api/auth']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If user is not authenticated and trying to access a protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/welcome', request.url))
  }
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (token && (pathname.startsWith('/auth') || pathname === '/welcome')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // If user is authenticated and on root path, allow access to dashboard
  if (token && pathname === '/') {
    return NextResponse.next()
  }
  
  // If user is not authenticated and on root path, redirect to welcome
  if (!token && pathname === '/') {
    return NextResponse.redirect(new URL('/welcome', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}