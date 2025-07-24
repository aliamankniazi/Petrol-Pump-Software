
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

// This page is temporarily disabled to bypass the initial setup flow.
// It now redirects to the login page.
export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal/> Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           <p className="text-muted-foreground">Redirecting to the login page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
