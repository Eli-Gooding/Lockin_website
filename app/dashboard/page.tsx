'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Download, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/supabase';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get session directly
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to auth');
          router.push('/auth');
          return;
        }

        console.log('Session found:', session.user.email);

        try {
          // Fetch user data with the session
          const response = await fetch('/api/user', {
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const userData = await response.json();
          setUser(userData);
          
          // Track dashboard view
          trackEvent(AnalyticsEvents.VIEW_DASHBOARD, {
            userId: userData.id,
            hasSubscription: userData.has_active_subscription
          });
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Track sign out
      trackEvent(AnalyticsEvents.SIGN_OUT);
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (platform: string) => {
    if (!user?.has_active_subscription) {
      router.push('/checkout');
      return;
    }

    setIsDownloading(true);
    
    try {
      // For now, we'll just simulate a download with a dummy text file
      const dummyContent = `LockIn App for ${platform}\nThis is a placeholder for the actual app download.`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `LockIn-${platform}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Track app download from dashboard
      trackEvent(AnalyticsEvents.DOWNLOAD_APP, {
        platform,
        fromDashboard: true,
        hasSubscription: user?.has_active_subscription
      });
      
      toast({
        title: 'Download started',
        description: `Your LockIn app for ${platform} is downloading.`,
      });
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: 'Download failed',
        description: 'There was an error starting your download.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChangeEmail = async () => {
    router.push('/account/update-email');
  };

  const handleChangePassword = async () => {
    router.push('/account/update-password');
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <div className="animate-pulse h-8 w-32 bg-gray-700 rounded mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
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
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Welcome, {user?.email?.split('@')[0] || 'User'}</h2>
          
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-medium mb-4">Your Subscription</h3>
            
            {user?.has_active_subscription ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-emerald-400">Active Subscription</p>
                    <p className="text-sm text-gray-400">You have full access to LockIn</p>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
                    Active
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Download LockIn</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="border-gray-700 hover:bg-gray-800"
                      onClick={() => handleDownload('macOS')}
                      disabled={isDownloading}
                    >
                      <Download className="mr-2 h-4 w-4" /> macOS
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-700 hover:bg-gray-800"
                      onClick={() => handleDownload('Windows')}
                      disabled={isDownloading}
                    >
                      <Download className="mr-2 h-4 w-4" /> Windows
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-700 hover:bg-gray-800"
                      onClick={() => handleDownload('Linux')}
                      disabled={isDownloading}
                    >
                      <Download className="mr-2 h-4 w-4" /> Linux
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">No Active Subscription</p>
                    <p className="text-sm text-gray-400">Subscribe to LockIn to get started</p>
                  </div>
                  <div className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-sm">
                    Inactive
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="mb-4 text-gray-400">
                    Get access to LockIn for just $2/month
                  </p>
                  <Link href="/checkout">
                    <Button className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30">
                      Subscribe Now
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-medium mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 hover:bg-gray-800"
                  onClick={handleChangeEmail}
                >
                  Change
                </Button>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-gray-400">••••••••</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 hover:bg-gray-800"
                  onClick={handleChangePassword}
                >
                  Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 