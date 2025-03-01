import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing');
}

// Create a Supabase client with persistent session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Use the default storage key that Supabase expects
    storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use pkce flow for better security
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