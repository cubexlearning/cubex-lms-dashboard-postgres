import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // Public routes that don't need authentication
    const publicRoutes = ['/login', '/api/auth', '/api/setup']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userRole = token.role as string

    // Role-based route protection
    if (pathname.startsWith('/admin')) {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), req.url))
      }
    }
    
    if (pathname.startsWith('/tutor')) {
      if (!['SUPER_ADMIN', 'ADMIN', 'TUTOR'].includes(userRole)) {
        return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), req.url))
      }
    }
    
    if (pathname.startsWith('/student')) {
      if (!['STUDENT'].includes(userRole)) {
        return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), req.url))
      }
    }

    if (pathname.startsWith('/parent')) {
      if (!['PARENT'].includes(userRole)) {
        return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), req.url))
      }
    }

    // Redirect root path based on role
    if (pathname === '/') {
      return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ['/login', '/api/auth', '/api/setup', '/test-db']
        if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
          return true
        }
        // For protected routes, require a token
        return !!token
      },
    },
  }
)

function getRoleBasedRedirect(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin'
    case 'TUTOR':
      return '/tutor'
    case 'STUDENT':
      return '/student'
    case 'PARENT':
      return '/parent'
    default:
      return '/login'
  }
}

export const config = {
  matcher: [
    // Only match specific protected routes, not API routes
    '/admin/:path*',
    '/tutor/:path*', 
    '/student/:path*',
    '/parent/:path*',
    '/'
  ],
}
