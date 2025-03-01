'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignInForm from '@/components/auth/sign-in-form';
import SignUpForm from '@/components/auth/sign-up-form';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin');
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Check if user is coming back after email confirmation
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      toast({
        title: 'Email verified',
        description: 'Your email has been verified. You can now sign in.',
      });
      setActiveTab('signin');
    }
  }, [searchParams, toast]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent inline-block">
              LockIn
            </h1>
          </Link>
          <p className="text-gray-400">Stay focused. Get things done.</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-xl">
          <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6 bg-gray-800/50">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <div className="mb-4">
                <h2 className="text-xl font-medium mb-1">Welcome back</h2>
                <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
              </div>
              <SignInForm />
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="mb-4">
                <h2 className="text-xl font-medium mb-1">Create an account</h2>
                <p className="text-gray-400 text-sm">Sign up to get started with LockIn</p>
              </div>
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </main>
  );
} 