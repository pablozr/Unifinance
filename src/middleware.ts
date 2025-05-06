import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { headers } from 'next/headers';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create a Supabase client for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh the session
  const { data: { session } } = await supabase.auth.getSession();

  // Only protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // For API routes, ensure the session is refreshed
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // We've already refreshed the session above, so just return the response
    return response;
  }

  // Add Content Security Policy headers
  // Only apply strict CSP in production
  const cspHeader = process.env.NODE_ENV === 'production'
    ? `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https://*.supabase.co https://www.gravatar.com https://*.stripe.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://api.stripe.com;
      frame-src 'self' https://js.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
    : // More permissive CSP for development
    `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https://*.supabase.co https://www.gravatar.com https://*.stripe.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' http://localhost:* https://*.supabase.co https://api.stripe.com;
      frame-src 'self' https://js.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

  // Add security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Allow access to all other routes
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};
