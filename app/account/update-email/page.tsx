'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function UpdateEmailPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth');
          return;
        }

        setCurrentUser(session.user);
        setEmail(session.user.email || '');
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, toast]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (email === currentUser.email) {
      toast({
        title: 'No change',
        description: 'The new email is the same as your current email',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      // First update the email in Supabase Auth
      const { error } = await supabase.auth.updateUser({ 
        email: email
      });
      
      if (error) throw error;
      
      // Track email update
      trackEvent(AnalyticsEvents.UPDATE_EMAIL, {
        userId: currentUser?.id
      });
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your new email to verify the change',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <div className="animate-pulse h-8 w-32 bg-gray-700 rounded mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent inline-block">
              LockIn
            </h1>
          </Link>
          <p className="text-gray-400">Update your email address</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-medium mb-4">Change Email</h2>
          
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-new-email@example.com"
                required
                className="bg-gray-800/50 border-gray-700"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                {isUpdating ? 'Updating...' : 'Update Email'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Toaster />
    </main>
  );
} 