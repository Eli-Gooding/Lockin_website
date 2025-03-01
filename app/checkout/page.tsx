'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CreditCard, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/supabase';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get session directly
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to auth');
          toast({
            title: 'Authentication required',
            description: 'Please sign in to continue',
            variant: 'destructive',
          });
          router.push('/auth');
          return;
        }

        console.log('Session found:', session.user.email);
        console.log('Session token:', session.access_token.substring(0, 10) + '...');

        try {
          // Fetch user data with the session
          const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Authorization': `Bearer ${session.access_token}`,
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            console.error('API error status:', response.status);
            const errorData = await response.json().catch(() => ({}));
            console.error('API error data:', errorData);
            throw new Error(`API error: ${response.status}`);
          }
          
          const userData = await response.json();
          console.log('User data fetched successfully:', userData);
          
          if (userData.has_active_subscription) {
            // User already has a subscription, redirect to dashboard
            router.push('/dashboard');
            return;
          }
          
          setUser(userData);
          
          // Track checkout page view
          trackEvent(AnalyticsEvents.VIEW_CHECKOUT);
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load user data. Please try refreshing the page.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: 'Session Error',
          description: 'Your session has expired. Please sign in again.',
          variant: 'destructive',
        });
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, toast]);

  const handleCheckout = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Track checkout start
    trackEvent(AnalyticsEvents.START_CHECKOUT, {
      email: user.email,
      userId: user.id
    });

    try {
      console.log('Starting checkout process for:', user.email);
      
      // Get the current session to ensure we have a fresh token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found when starting checkout');
        throw new Error('Your session has expired. Please sign in again.');
      }
      
      console.log('Session confirmed before checkout:', session.user.email);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        console.error('Checkout error status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout error data:', errorData);
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No checkout URL returned from the server');
      }

      console.log('Redirecting to checkout:', data.url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <div className="animate-pulse h-8 w-32 bg-gray-700 rounded mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              LockIn
            </h1>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Complete Your Purchase</h2>
          <p className="text-gray-400 mb-8">Get full access to LockIn and boost your productivity</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-medium mb-4">LockIn Premium</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Unlimited Task Management</p>
                      <p className="text-sm text-gray-400">Create and manage as many tasks as you need</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Smart Focus Features</p>
                      <p className="text-sm text-gray-400">AI-powered focus tools to keep you on track</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Cross-Platform Access</p>
                      <p className="text-sm text-gray-400">macOS support now, Windows coming soon</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Priority Support</p>
                      <p className="text-sm text-gray-400">Get help when you need it</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-sm text-gray-400">Recurring access to LockIn</p>
                  </div>
                  <div className="text-2xl font-bold">$2.00</div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg font-medium">Secure Checkout</h3>
                </div>
                
                <p className="text-gray-400 text-sm mb-6">
                  Your payment is processed securely through Stripe. We don't store your payment details.
                </p>
                
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full px-6 py-6 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 h-fit">
              <h3 className="text-xl font-medium mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">LockIn Premium</span>
                  <span>$2.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-800 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>$2.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 