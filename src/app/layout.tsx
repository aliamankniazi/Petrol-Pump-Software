
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { RolesProvider, useRoles } from '@/hooks/use-roles';
import { AppLayout } from '@/components/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { InstitutionProvider, useInstitution } from '@/hooks/use-institution.tsx';
import { InstitutionSelector } from '@/components/institution-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function PrintStyles() {
    const pathname = usePathname();
    if (pathname.startsWith('/invoice/')) {
        return <link rel="stylesheet" href="/print-globals.css" media="print" />;
    }
    return null;
}

const FullscreenMessage = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="flex h-screen w-full items-center justify-center bg-muted">
     <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal/> {title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
     </Card>
   </div>
);


const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { currentInstitution, isLoaded: institutionLoaded } = useInstitution();
  const { isReady: rolesReady, hasPermission } = useRoles();
  const pathname = usePathname();
  const router = useRouter();

  // If Firebase isn't configured, block the entire app and show instructions.
  if (!isFirebaseConfigured()) {
    return (
        <FullscreenMessage title="Firebase Not Configured">
            <p className="text-destructive font-semibold">Action Required: Your Firebase credentials are not set up.</p>
            <p className="mt-2 text-muted-foreground">To use the application, you must add your Firebase project configuration to the file:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-2 text-sm">src/lib/firebase-client.ts</code>
        </FullscreenMessage>
    );
  }

  // Determine the overall loading state. We are loading if auth is checking, or if a user is logged in
  // but their associated data (institution, roles) hasn't been loaded yet.
  const isLoading = authLoading || (!!user && (!institutionLoaded || !rolesReady));
  
  React.useEffect(() => {
    // Wait until the initial loading is done before running any routing logic.
    if (isLoading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    
    // If we have a user, they shouldn't be on an auth page.
    if (user) { 
      if (isAuthPage) {
        router.replace('/dashboard');
      }
    } else { // If we don't have a user, they MUST be on an auth page.
      if (!isAuthPage) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  // While loading, show a simplified skeleton screen to avoid layout shifts.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
       <div className="space-y-4 w-1/2 max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
       </div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (!user || isAuthPage) {
    return <>{children}</>;
  }
  
  if (!currentInstitution) {
    return <InstitutionSelector />;
  }

  return <AppLayout hasPermission={hasPermission}>{children}</AppLayout>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
          <PrintStyles />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <InstitutionProvider>
            <RolesProvider>
              <AppContainer>
                {children}
              </AppContainer>
            </RolesProvider>
          </InstitutionProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
