
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
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstUser = async () => {
      if (db) {
        const usersRef = ref(db, 'userMappings'); // Check if any user mappings exist
        const snapshot = await get(usersRef);
        setIsFirstUser(!snapshot.exists());
      } else {
        setIsFirstUser(true); // Assume first user if db not ready
      }
    };

    checkFirstUser();
  }, []);

  useEffect(() => {
    if (authLoading || isFirstUser === null) {
      return; // Wait until both auth state and first user check are complete
    }

    if (user) {
      router.replace('/dashboard');
    } else if (isFirstUser) {
      // Allow first user to proceed to create an account which will be super-admin
      router.replace('/users');
    } else {
      // If not the first user, they cannot sign up here.
      router.replace('/login');
    }
  }, [user, authLoading, isFirstUser, router]);
  
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
