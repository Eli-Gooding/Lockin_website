import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { APP_BUCKET_NAME, MAC_APP_PATH } from '@/lib/supabase';

// Set dynamic runtime to handle cookies
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Create a Supabase client for server-side operations with proper cookie handling
    const cookieStore = cookies();
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            const value = cookie?.value;
            return value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Get the current session
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();

    // Try to get the authorization header as a fallback
    let user = session?.user;
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('Found authorization header, attempting to use token');
        const token = authHeader.substring(7);
        
        try {
          const { data: { user: tokenUser }, error } = await supabaseServer.auth.getUser(token);
          if (!error && tokenUser) {
            user = tokenUser;
          }
        } catch (tokenError) {
          console.error('Token authentication error:', tokenError);
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the platform from the query string
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform') || 'mac';
    
    if (platform !== 'mac') {
      return NextResponse.json(
        { error: 'Only macOS is currently supported' },
        { status: 400 }
      );
    }

    // Check if the user has an active subscription
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('has_active_subscription')
      .eq('id', user.id)
      .single();

    if (!profile?.has_active_subscription) {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    // Get a signed URL that expires in 10 minutes
    const { data, error } = await supabaseServer
      .storage
      .from(APP_BUCKET_NAME)
      .createSignedUrl(MAC_APP_PATH, 10 * 60);
    
    if (error) {
      console.error('Error getting download URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      );
    }
    
    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 