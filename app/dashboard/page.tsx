'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { supabase, getUser, GOOGLE_DRIVE_URLS } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle, XCircle, Apple, Monitor } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/supabase';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

        try {
          // Fetch user data with the session
          const response = await fetch('/api/user', {
            headers: {
              'Cache-Control': 'no-cache',
              'Authorization': `Bearer ${session.access_token}`,
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            console.error('API error status:', response.status);
            throw new Error(`API error: ${response.status}`);
          }
          
          const userData = await response.json();
          console.log('User data fetched successfully:', userData);
          setUser(userData);
          
          // Track dashboard page view
          trackEvent(AnalyticsEvents.VIEW_DASHBOARD);
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

  const handleDownload = (platform: 'mac' | 'windows') => {
    if (!user?.has_active_subscription) {
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to download the app.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Track download attempt
      trackEvent(AnalyticsEvents.APP_DOWNLOAD, {
        platform,
        userId: user.id
      });
      
      if (platform === 'windows') {
        toast({ 
          title: 'Coming Soon', 
          description: 'Windows version is coming soon. Currently only macOS is supported.' 
        });
        return;
      }
      
      // For macOS, we use the direct Google Drive link
      window.open(GOOGLE_DRIVE_URLS.mac, '_blank');
      
      toast({ 
        title: 'Download Started', 
        description: 'Your download should begin shortly.' 
      });
    } catch (error: any) {
      console.error('Error downloading app:', error);
      toast({
        title: 'Download Error',
        description: error.message || 'Failed to download the app. Please try again.',
        variant: 'destructive',
      });
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
          <p className="text-gray-400">Loading dashboard...</p>
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.username || user?.email?.split('@')[0]}</h2>
          <p className="text-gray-400 mb-8">Manage your LockIn account and download the app</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-medium mb-4">Download LockIn</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* macOS Download Card */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <Apple className="h-12 w-12 text-emerald-400 mb-4" />
                    <h4 className="text-xl font-medium mb-1">macOS</h4>
                    <p className="text-sm text-gray-400 mb-6">Compatible with macOS 10.15 (Catalina) and later</p>
                    
                    {user?.has_active_subscription ? (
                      <a 
                        href={GOOGLE_DRIVE_URLS.mac} 
                        download
                        onClick={() => handleDownload('mac')}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                      >
                        <Download className="mr-2 h-5 w-5" />
                        Download for Mac
                      </a>
                    ) : (
                      <Button 
                        onClick={() => router.push('/checkout')}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600"
                      >
                        Subscribe to Download
                      </Button>
                    )}
                  </div>
                  
                  {/* Windows Download Card */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <Monitor className="h-12 w-12 text-gray-500 mb-4" />
                    <h4 className="text-xl font-medium mb-1">Windows</h4>
                    <p className="text-sm text-gray-400 mb-6">Windows support is coming soon</p>
                    
                    <Button 
                      onClick={() => handleDownload('windows')}
                      disabled={true}
                      className="px-6 py-3 bg-gray-700 cursor-not-allowed"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 h-fit">
              <h3 className="text-xl font-medium mb-4">Subscription Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  {user?.has_active_subscription ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
                      <span className="text-emerald-400">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-400">Inactive</span>
                    </div>
                  )}
                </div>
                
                {!user?.has_active_subscription && (
                  <Link href="/checkout">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                      Subscribe Now
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 