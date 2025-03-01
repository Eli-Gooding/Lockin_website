import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Set dynamic runtime to handle cookies
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Create a Supabase client for server-side operations with proper cookie handling
    const cookieStore = cookies();
    
    // Log all available cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('Available cookies in user API:', allCookies.map(c => c.name));
    
    // Check if we have any Supabase cookies
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    if (supabaseCookies.length === 0) {
      console.log('No Supabase cookies found');
    } else {
      console.log('Found Supabase cookies:', supabaseCookies.map(c => c.name));
    }
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            const value = cookie?.value;
            console.log(`Getting cookie ${name}:`, value ? 'found' : 'not found');
            return value;
          },
          set(name: string, value: string, options: any) {
            console.log(`Setting cookie ${name}`);
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            console.log(`Removing cookie ${name}`);
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Get the current session
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error' },
        { status: 401 }
      );
    }

    if (!session) {
      console.log('No session found in API');
      
      // Try to get the authorization header as a fallback
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('Found authorization header, attempting to use token');
        const token = authHeader.substring(7);
        
        try {
          const { data: { user }, error } = await supabaseServer.auth.getUser(token);
          
          if (error || !user) {
            console.error('Error getting user from token:', error);
            return NextResponse.json(
              { error: 'Invalid token' },
              { status: 401 }
            );
          }
          
          console.log('Successfully authenticated with token for user:', user.email);
          
          // Get the user profile
          const { data: profile } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          return NextResponse.json({
            id: user.id,
            email: user.email || '',
            username: profile?.username || user.user_metadata?.username,
            has_active_subscription: profile?.has_active_subscription || false,
            created_at: user.created_at,
          });
        } catch (tokenError) {
          console.error('Token authentication error:', tokenError);
        }
      }
      
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Session found for user:', session.user.email);

    // Get the user profile from the database
    try {
      const { data: profile, error: profileError } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.log('Profile not found, creating new profile');
        
        // If profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabaseServer
          .from('profiles')
          .insert([
            { 
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
              has_active_subscription: false
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          id: session.user.id,
          email: session.user.email || '',
          username: newProfile.username || session.user.user_metadata?.username,
          has_active_subscription: false,
          created_at: session.user.created_at,
        });
      }

      // Return the user data
      return NextResponse.json({
        id: session.user.id,
        email: session.user.email || '',
        username: profile.username || session.user.user_metadata?.username,
        has_active_subscription: profile.has_active_subscription || false,
        created_at: session.user.created_at,
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 