
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase-client';

export default function SignupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');

  useEffect(() => {
    // This effect should only run once, after the initial auth check.
    if (authLoading) {
      return; // Wait until auth state is known
    }

    if (user) {
      // If a user is already logged in, they should go to the dashboard.
      router.replace('/dashboard');
      setStatus('redirecting');
      return;
    }

    // If no user is logged in, check if it's the first setup.
    const checkFirstSetup = async () => {
      if (!db) {
        // Firebase isn't configured, so we can't proceed.
        // The layout will show a config error message.
        console.error("Firebase is not configured.");
        setStatus('error');
        return;
      }

      try {
        const institutionsRef = ref(db, 'institutions');
        const snapshot = await get(institutionsRef);
        
        if (snapshot.exists()) {
          // Institutions exist, so it's not the first setup. Redirect to login.
          router.replace('/login');
        } else {
          // No institutions exist. This is the first setup. Redirect to user creation.
          router.replace('/users');
        }
        setStatus('redirecting');
      } catch (error) {
        console.error("Error checking for first setup:", error);
        setStatus('error');
      }
    };

    checkFirstSetup();

  }, [authLoading, user, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus /> {status === 'error' ? 'Error' : 'Initializing'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we check the application status...'}
            {status === 'redirecting' && 'Redirecting you to the correct page...'}
            {status === 'error' && 'Could not connect to the database. Please check your configuration.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex justify-center items-center gap-2">
             {status !== 'error' && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
             <p className="text-center">
                {status === 'loading' && 'Loading...'}
                {status === 'redirecting' && 'Please wait...'}
                {status === 'error' && 'Setup check failed.'}
             </p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
