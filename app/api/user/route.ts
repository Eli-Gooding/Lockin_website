import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Set dynamic runtime to handle cookies
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create a Supabase client for server-side operations with proper cookie handling
    const cookieStore = cookies();
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
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

    // Get the current user
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // If the profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabaseServer
          .from('profiles')
          .insert([{ id: user.id, email: user.email }])
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
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || null,
          has_active_subscription: false,
          subscription: null,
          created_at: user.created_at,
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
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    // Return user data
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: profile?.username || user.user_metadata?.username,
      has_active_subscription: profile?.has_active_subscription || false,
      subscription: subscription || null,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 