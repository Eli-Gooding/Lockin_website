'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to sign in with:', email);
      
      // Clear any existing sessions first to avoid conflicts
      await supabase.auth.signOut();
      
      // Sign in with email and password
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Sign in successful, session established');
      console.log('Session token:', data.session.access_token.substring(0, 10) + '...');
      
      // Track successful sign in
      trackEvent(AnalyticsEvents.SIGN_IN, {
        userId: data.user?.id
      });

      toast({
        title: 'Success',
        description: 'You have been signed in',
      });
      
      // Ensure the session is properly set before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the session was properly set
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('Session not established after sign in');
        throw new Error('Failed to establish session');
      }
      
      console.log('Session verified, redirecting to dashboard');
      
      // Test the API connection before redirecting
      try {
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          console.log('API connection successful');
          const userData = await response.json();
          console.log('User data:', userData);
        } else {
          console.error('API connection failed:', response.status);
          const errorText = await response.text();
          console.error('API error:', errorText);
        }
      } catch (apiError) {
        console.error('API test error:', apiError);
      }
      
      // Redirect to dashboard or home page
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Error signing in',
        description: error.message || 'Please check your credentials and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
} 