import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Edge Middleware for dual-app routing
 *
 * This middleware runs at the Vercel edge for every incoming request.
 * It intelligently routes requests to either the admin app or business app
 * based on the request pathname.
 *
 * Benefits:
 * - Runs at edge (closest to user) = lower latency
 * - Faster than serverless functions
 * - Can inspect headers, query params, cookies, etc.
 * - Official Vercel recommended pattern for complex routing
 */

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin routes - must match before general assets
  if (pathname.startsWith('/admin')) {
    // Admin static assets
    if (pathname.match(/^\/admin\/assets\//)) {
      return NextResponse.rewrite(new URL(pathname, request.url));
    }

    // Admin pages (.html files) - rewrite to /admin/index.html (not /admin.html)
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.rewrite(
        new URL('/admin/index.html', request.url),
        {
          request: {
            headers: {
              'x-app-context': 'admin',
            },
          },
        }
      );
    }

    // All other /admin/* routes go to /admin/index.html (SPA routing)
    return NextResponse.rewrite(
      new URL('/admin/index.html', request.url),
      {
        request: {
          headers: {
            'x-app-context': 'admin',
          },
        },
      }
    );
  }

  // Business app assets
  if (pathname.startsWith('/assets/')) {
    return NextResponse.rewrite(new URL(pathname, request.url));
  }

  // Static files that exist in public directory
  if (
    pathname.match(/\.(svg|png|jpeg|jpg|ico|css|js)$/) ||
    pathname === '/firebase-messaging-sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.rewrite(new URL(pathname, request.url));
  }

  // Business app HTML files
  if (pathname === '/business.html' || pathname === '/router.html') {
    return NextResponse.rewrite(new URL(pathname, request.url));
  }

  // Root path defaults to business app
  if (pathname === '/' || pathname === '') {
    return NextResponse.rewrite(
      new URL('/business.html', request.url),
      {
        request: {
          headers: {
            'x-app-context': 'business',
          },
        },
      }
    );
  }

  // /app path explicitly goes to business app
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return NextResponse.rewrite(
      new URL('/business.html', request.url),
      {
        request: {
          headers: {
            'x-app-context': 'business',
          },
        },
      }
    );
  }

  // All other routes default to business app (SPA routing)
  return NextResponse.rewrite(
    new URL('/business.html', request.url),
    {
      request: {
        headers: {
          'x-app-context': 'business',
        },
      },
    }
  );
}

/**
 * Configure which paths trigger the middleware
 * This pattern matches all requests except Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
/* Deployment trigger */
