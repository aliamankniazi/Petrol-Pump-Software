
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
  const [isFirstSetup, setIsFirstSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstSetup = async () => {
      if (db) {
        // If no institutions exist, it's the first time setup.
        const institutionsRef = ref(db, 'institutions');
        const snapshot = await get(institutionsRef);
        setIsFirstSetup(!snapshot.exists());
      } else {
        // If Firebase isn't configured, we can't proceed.
        // The layout will show a config error message.
        setIsFirstSetup(false);
      }
    };

    if (!authLoading && !user) {
        checkFirstSetup();
    } else if (!authLoading && user) {
        // A user is already logged in, so this can't be the first user setup.
        setIsFirstSetup(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    // Wait for all checks to complete
    if (authLoading || isFirstSetup === null) {
      return; 
    }

    if (user) {
      // If user is already logged in, they should not be here.
      router.replace('/dashboard');
    } else if (isFirstSetup) {
      // This is the first ever user. They need to create the initial super-admin account.
      // Redirect them to the user management page where they can do this.
      router.replace('/users');
    } else {
      // The system is already set up. New users cannot sign up directly.
      // They must be invited by an admin. Redirect to login.
      router.replace('/login');
    }
  }, [user, authLoading, isFirstSetup, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus /> Initializing
          </CardTitle>
          <CardDescription>
            Please wait while we check the application status...
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex justify-center items-center gap-2">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             <p className="text-center">Loading...</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
