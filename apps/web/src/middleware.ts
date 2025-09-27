import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and special Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Handle dashboard routes - temporarily allow all access for demo
  // In production, you'd want proper authentication checks here
  if (pathname.startsWith('/dashboard')) {
    // Allow all dashboard access for now
    return NextResponse.next()
  }

  // Allow all other routes to pass through
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - Image optimization files
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
}
