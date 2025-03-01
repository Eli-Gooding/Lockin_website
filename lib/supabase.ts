import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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