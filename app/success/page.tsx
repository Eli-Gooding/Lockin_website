'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Download, Apple, MonitorIcon, TerminalSquare } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Component that uses search params
function SuccessContent() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get session ID from URL
  const sessionId = searchParams.get('session_id');

  const handleDownload = async (platform: 'mac' | 'windows' | 'linux') => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter the email you used for purchase',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to the appropriate download URL
      window.location.href = data.downloadUrls[platform];
      
      toast({
        title: 'Download started',
        description: `Your ${platform} download has started. If it doesn't begin automatically, please click the link again.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start download. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center text-center">
      <div className="mb-8">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-400">
          Thank you for your purchase. You can now download and use LockIn.
        </p>
      </div>

      <div className="w-full bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Next Steps</h2>
        <ol className="text-left space-y-4 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="bg-emerald-500/20 text-emerald-500 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Enter the email you used for purchase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-emerald-500/20 text-emerald-500 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Download the LockIn app for your platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-emerald-500/20 text-emerald-500 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>Install the application and sign in with your email</span>
          </li>
        </ol>
      </div>

      <div className="w-full mb-6">
        <input
          type="email"
          placeholder="Enter your purchase email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full mb-4"
        />
        
        {!showDownloadOptions ? (
          <Button 
            onClick={() => setShowDownloadOptions(true)}
            className="w-full px-4 py-6 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30"
          >
            <Download className="mr-2 h-5 w-5" /> Download LockIn
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => handleDownload('mac')}
              disabled={isLoading}
              variant="outline"
              className="flex flex-col items-center py-4 border-gray-700 hover:bg-gray-800"
            >
              <Apple className="h-8 w-8 mb-2" />
              <span>macOS</span>
            </Button>
            <Button
              onClick={() => handleDownload('windows')}
              disabled={isLoading}
              variant="outline"
              className="flex flex-col items-center py-4 border-gray-700 hover:bg-gray-800"
            >
              <MonitorIcon className="h-8 w-8 mb-2" />
              <span>Windows</span>
            </Button>
            <Button
              onClick={() => handleDownload('linux')}
              disabled={isLoading}
              variant="outline"
              className="flex flex-col items-center py-4 border-gray-700 hover:bg-gray-800"
            >
              <TerminalSquare className="h-8 w-8 mb-2" />
              <span>Linux</span>
            </Button>
          </div>
        )}
      </div>

      <Link href="/" className="text-emerald-400 hover:text-emerald-300">
        Return to homepage
      </Link>
    </div>
  );
}

// Loading fallback
function SuccessLoading() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="animate-pulse h-16 w-16 bg-emerald-500/20 rounded-full mb-4 mx-auto"></div>
      <div className="animate-pulse h-8 w-48 bg-gray-700 rounded mb-4 mx-auto"></div>
      <p className="text-gray-400">Loading payment details...</p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
      <Suspense fallback={<SuccessLoading />}>
        <SuccessContent />
      </Suspense>
      <Toaster />
    </main>
  );
} 