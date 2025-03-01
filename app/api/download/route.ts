import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Set dynamic runtime
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the user has an active subscription
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!profile.has_active_subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    // In a real application, you would generate a signed URL to download the app
    // For this example, we'll just return a mock download URL
    const downloadUrls = {
      mac: 'https://example.com/download/lockin-mac.dmg',
      windows: 'https://example.com/download/lockin-windows.exe',
      linux: 'https://example.com/download/lockin-linux.AppImage',
    };

    return NextResponse.json({ downloadUrls });
  } catch (error) {
    console.error('Error processing download request:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
} 