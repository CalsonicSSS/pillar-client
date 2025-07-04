'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/apiBase';
import Link from 'next/link';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Gmail connection...');
  const hasProcessedRef = useRef(false); // Use ref to prevent duplicate processing

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessedRef.current) {
        console.log('OAuth callback already processed, skipping...');
        return;
      }
      hasProcessedRef.current = true;

      try {
        // Extract OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // This is the channel_id
        const error = searchParams.get('error');

        console.log('Processing OAuth callback - Code:', code?.substring(0, 20) + '...', 'State:', state);

        // Check for OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`OAuth authorization failed: ${error}`);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setStatus('error');
          setMessage('Missing OAuth parameters. Please try connecting your Gmail channel again.');
          return;
        }

        // Send OAuth code and state to backend for processing
        const response = await fetch(`${API_BASE_URL}/gmail/channel/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to process OAuth callback');
        }

        const result = await response.json();
        console.log('OAuth callback result:', result);

        // Success! Show success message
        setStatus('success');
        setMessage(result.status_message || 'Gmail channel connected successfully!');

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          redirectToProject();
        }, 3000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Failed to connect Gmail channel');
      }
    };

    // Add a small delay to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      handleOAuthCallback();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchParams, router]);

  const redirectToProject = () => {
    // Try to get stored project context from sessionStorage
    const storedProjectId = sessionStorage.getItem('oauth_project_id');
    const storedReturnUrl = sessionStorage.getItem('oauth_return_url');

    // Clean up storage
    sessionStorage.removeItem('oauth_project_id');
    sessionStorage.removeItem('oauth_return_url');

    if (storedReturnUrl) {
      // Redirect to the exact page user was on
      window.location.href = storedReturnUrl;
    } else if (storedProjectId) {
      // Redirect to the project page
      router.push(`/projects/${storedProjectId}`);
    } else {
      // Fallback to dashboard
      router.push('/dashboard');
    }
  };

  const handleReturnNow = () => {
    redirectToProject();
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4'>
        <div className='text-center'>
          {status === 'loading' && (
            <>
              <Loader2 className='h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Connecting Gmail...</h2>
              <p className='text-gray-600'>{message}</p>
              <div className='mt-4 text-sm text-gray-500'>
                <p>Please wait while we complete the setup</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className='h-12 w-12 text-green-600 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Success!</h2>
              <p className='text-gray-600 mb-6'>{message}</p>
              <div className='space-y-3'>
                <Button onClick={handleReturnNow} className='w-full gap-2 mb-3'>
                  <ArrowLeft className='h-4 w-4' />
                  Return to Project
                </Button>
                <Link href='/dashboard'>
                  <Button variant='outline' className='w-full mb-3'>
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
              <p className='text-sm text-gray-500 mt-4'>Auto-redirecting in 3 seconds...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className='h-12 w-12 text-red-600 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Connection Failed</h2>
              <p className='text-gray-600 mb-6'>{message}</p>
              <div className='space-y-3'>
                <Link href='/dashboard'>
                  <Button className='w-full gap-2'>
                    <ArrowLeft className='h-4 w-4' />
                    Return to Dashboard
                  </Button>
                </Link>
                <Button variant='outline' className='w-full' onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4'>
            <div className='text-center'>
              <Loader2 className='h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Loading...</h2>
              <p className='text-gray-600'>Processing OAuth callback...</p>
            </div>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
