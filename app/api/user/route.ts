import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Set dynamic runtime to handle cookies
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create a Supabase client for server-side operations with proper cookie handling
    const cookieStore = cookies();
    
    // Log available cookies for debugging
    console.log('Available cookies:', cookieStore.getAll().map(c => c.name));
    
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Session found for user:', session.user.email);

    // Get the user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // If the profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        console.log('Creating new profile for user:', session.user.id);
        const { data: newProfile, error: createError } = await supabaseServer
          .from('profiles')
          .insert([{ 
            id: session.user.id, 
            email: session.user.email,
            username: session.user.user_metadata?.username || null
          }])
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
          email: session.user.email,
          username: session.user.user_metadata?.username || null,
          has_active_subscription: false,
          subscription: null,
          created_at: session.user.created_at,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Get subscription information if needed
    const { data: subscription } = await supabaseServer
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    // Return user data
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      username: profile?.username || session.user.user_metadata?.username,
      has_active_subscription: profile?.has_active_subscription || false,
      subscription: subscription || null,
      created_at: session.user.created_at,
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 