import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Set dynamic runtime to handle cookies
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('Starting checkout session creation process');
    
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
      console.log('No session found in checkout API');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Session found for user:', session.user.email);

    // Parse the request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      console.log('No email provided in request body');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify that the email matches the authenticated user
    if (email !== session.user.email) {
      console.log('Email mismatch:', { requestEmail: email, sessionEmail: session.user.email });
      return NextResponse.json(
        { error: 'Email does not match authenticated user' },
        { status: 403 }
      );
    }

    console.log('Creating checkout session for:', email);
    
    // Create a checkout session
    const checkoutSession = await createCheckoutSession(email);
    
    if (!checkoutSession || !checkoutSession.url) {
      console.error('Failed to create checkout session');
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    console.log('Checkout session created successfully, URL:', checkoutSession.url);
    
    // Return the checkout session URL
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 