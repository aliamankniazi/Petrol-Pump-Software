
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const { user, isFirstUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If a user is already logged in, redirect them away.
        router.replace('/dashboard');
      } else if (!isFirstUser) {
        // If it's not the first user setup, this page is forbidden.
        router.replace('/login');
      }
    }
  }, [user, isFirstUser, loading, router]);

  // The actual form is now on the /users page.
  // This page is just a placeholder during the first user creation.
  
  if (loading || !isFirstUser) {
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
            This page is for the initial setup of the one and only Super Admin account. Please proceed to create other users from the 'Manage Users' section after logging in.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* The user creation form is now part of the /users page. This is a deliberate redirection. */}
           <p>Redirecting to user management to create the first account...</p>
        </CardContent>
      </Card>
    </div>
  );
}
