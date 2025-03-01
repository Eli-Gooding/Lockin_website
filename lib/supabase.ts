import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing');
}

// Extract the project reference from the URL
const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'cxxeznluwxayqmkignya';
console.log('Using Supabase project reference:', projectRef);

// Function to clear old Supabase cookies
const clearOldSupabaseCookies = () => {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // If it's a Supabase cookie but not for our current project
      if (cookie.startsWith('sb-') && !cookie.startsWith(`sb-${projectRef}`)) {
        const cookieName = cookie.split('=')[0];
        console.log('Clearing old Supabase cookie:', cookieName);
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  }
};

// Clear old cookies on initialization
if (typeof window !== 'undefined') {
  clearOldSupabaseCookies();
}

// Create a Supabase client with browser-specific cookie handling
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: `sb-${projectRef}-auth-token`,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });

// Create a service role client for admin operations (like webhooks)
// This bypasses RLS policies
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export type User = {
  id: string;
  email: string;
  username?: string;
  has_active_subscription: boolean;
  created_at: string;
};

export async function getUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;
    
    const user = session.user;
    
    // Get the user profile from the database
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    return {
      id: user.id,
      email: user.email || '',
      username: data?.username || user.user_metadata?.username,
      has_active_subscription: data?.has_active_subscription || false,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Constants for app downloads
export const APP_BUCKET_NAME = 'app-downloads';
export const MAC_APP_PATH = 'LockIn-mac.dmg';

// Google Drive download URLs
export const GOOGLE_DRIVE_URLS = {
  mac: process.env.NEXT_PUBLIC_MAC_GOOGLE_DRIVE_URL || 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID',
  windows: '' // Not available yet
};

/**
 * Get a signed URL for downloading the app
 * @param platform The platform to download for ('mac' | 'windows')
 * @returns A signed URL for downloading the app or null if error
 */
export async function getAppDownloadUrl(platform: 'mac' | 'windows'): Promise<string | null> {
  try {
    // Currently only macOS is supported
    if (platform !== 'mac') {
      console.log('Only macOS is currently supported');
      return null;
    }
    
    // If Google Drive URL is configured, use that instead of Supabase Storage
    if (GOOGLE_DRIVE_URLS.mac && GOOGLE_DRIVE_URLS.mac !== 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID') {
      console.log('Using Google Drive URL for macOS download');
      return GOOGLE_DRIVE_URLS.mac;
    }
    
    // Get a signed URL that expires in 60 minutes
    const { data, error } = await supabase
      .storage
      .from(APP_BUCKET_NAME)
      .createSignedUrl(MAC_APP_PATH, 60 * 60);
    
    if (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getAppDownloadUrl:', error);
    return null;
  }
} 