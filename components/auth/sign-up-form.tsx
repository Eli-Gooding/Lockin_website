'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail } from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
        },
      });

      if (error) {
        throw error;
      }

      // Track successful sign up
      trackEvent(AnalyticsEvents.SIGN_UP, {
        userId: data.user?.id,
        hasUsername: !!username
      });

      // Update the profile with username if provided
      if (username && data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      // Show success message
      toast({
        title: 'Verification email sent',
        description: 'Please check your email to verify your account',
      });
      
      // Set email sent state to show confirmation screen
      setEmailSent(true);
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center py-4">
        <div className="bg-emerald-500/20 text-emerald-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-medium mb-2">Check your email</h3>
        <p className="text-gray-400 mb-6">
          We've sent a verification link to <span className="text-white">{email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Please check your inbox and click the verification link to complete your registration.
          If you don't see the email, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSignUp} className="space-y-4">
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
          <Label htmlFor="username">Username (optional)</Label>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>
    </div>
  );
} 