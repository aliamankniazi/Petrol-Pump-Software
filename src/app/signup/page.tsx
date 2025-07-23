
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now a simple redirector to the correct user creation flow.
export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/users');
    }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <div className="flex justify-center items-center gap-2">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         <p className="text-center">Redirecting to setup page...</p>
       </div>
    </div>
  );
}
