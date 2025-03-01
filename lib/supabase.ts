import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing');
}

// Create a Supabase client with cookie-based auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type User = {
  id: string;
  email: string;
  username?: string;
  has_active_subscription: boolean;
  created_at: string;
};

export async function getUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
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