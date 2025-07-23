
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles.tsx';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase-client';

export default function SignupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstUser = async () => {
      if (db) {
        const usersRef = ref(db, 'userMappings'); // Check if any user mappings exist
        const snapshot = await get(usersRef);
        setIsFirstUser(!snapshot.exists());
      }
      setLoading(false);
    };

    checkFirstUser();
  }, []);

  useEffect(() => {
    if (authLoading || loading) {
      return; // Wait until both auth state and first user check are complete
    }

    if (user) {
      router.replace('/dashboard');
    } else if (isFirstUser) {
      router.replace('/users');
    } else {
      router.replace('/login');
    }
  }, [user, authLoading, isFirstUser, loading, router]);
  
  // Render a loading state while checks are in progress
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
           <p className="text-center">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
