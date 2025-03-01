import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client for server-side operations with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // If the cookie is being set, update the response
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          // If the cookie is being removed, update the response
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  // Log the path and authentication status for debugging
  console.log(`Middleware: ${request.nextUrl.pathname} - Authenticated: ${!!session}`);

  // Add the session to the response headers for debugging
  if (session) {
    response.headers.set('x-user-email', session.user.email || 'unknown');
  }

  return response;
}

// Only run middleware on API routes and protected pages
export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/checkout/:path*'],
}; 