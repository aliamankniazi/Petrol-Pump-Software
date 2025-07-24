
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now a simple redirector to the login page.
// The setup flow has been problematic, so this ensures users can access login.
export default function UsersPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <div className="flex justify-center items-center gap-2">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         <p className="text-center">Redirecting to login...</p>
       </div>
    </div>
  );
}
