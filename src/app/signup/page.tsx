
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles.tsx';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const { roles, isReady } = useRoles(); // Using useRoles to check for first user
  const router = useRouter();

  const isFirstUserSetup = roles.length === 0 && isReady;

  useEffect(() => {
    if (!loading && isReady) {
      if (user) {
        // If a user is already logged in, redirect them away.
        router.replace('/dashboard');
      } else if (!isFirstUserSetup) {
        // If it's not the first user setup, this page is forbidden.
        router.replace('/login');
      } else {
        // Redirect to the user creation page to create the super admin
        router.replace('/users');
      }
    }
  }, [user, isFirstUserSetup, loading, isReady, router]);

  // The actual form is now on the /users page.
  // This page is just a placeholder during the first user creation.
  
  if (loading || !isReady || !isFirstUserSetup) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <p>Loading...</p>
        </div>
     );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus /> Create Super Admin
          </CardTitle>
          <CardDescription>
            This page is for the initial setup of the one and only Super Admin account. Redirecting you to the user creation page.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p>Redirecting...</p>
        </CardContent>
      </Card>
    </div>
  );
}
