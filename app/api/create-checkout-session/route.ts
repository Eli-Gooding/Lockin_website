import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Set dynamic runtime
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Verify authentication first
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

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error in checkout:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(e => {
      console.error('Error parsing request body:', e);
      return {};
    });
    
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the email matches the authenticated user
    if (email !== user.email) {
      return NextResponse.json(
        { error: 'Email does not match authenticated user' },
        { status: 403 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession(email);

    if (!session || !session.url) {
      console.error('No session URL returned from Stripe');
      return NextResponse.json(
        { error: 'Failed to create checkout URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 