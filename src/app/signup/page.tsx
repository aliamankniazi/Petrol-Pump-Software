
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page now only serves as a placeholder while the logic in layout.tsx determines where to redirect.
export default function SignupPage() {
    const router = useRouter();

    // The logic is now in layout.tsx, but this can serve as a fallback.
    useEffect(() => {
        router.replace('/login');
    }, [router]);

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
