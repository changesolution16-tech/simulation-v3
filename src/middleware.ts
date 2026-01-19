import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role === 'student'
      ? 'learner'
      : token?.role === 'teacher'
      ? 'instructor'
      : token?.role;

    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (path.startsWith('/teacher') && role !== 'instructor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (path.startsWith('/login') || path.startsWith('/reset-password')) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/learner/:path*',
    '/simulation/:path*',
    '/simulations/:path*',
    '/settings/:path*',
  ],
};
