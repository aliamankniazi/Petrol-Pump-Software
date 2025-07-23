
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname, useRouter } from 'next/navigation';
import { RolesProvider, useRoles } from '@/hooks/use-roles.tsx';
import { AppLayout } from '@/components/app-layout';
import { isFirebaseConfigured, db } from '@/lib/firebase-client';
import { InstitutionSelector } from '@/components/institution-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { ref, get } from 'firebase/database';

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

const FullscreenMessage = ({ title, children, showSpinner = false }: { title: string, children: React.ReactNode, showSpinner?: boolean }) => (
  <div className="flex h-screen w-full items-center justify-center bg-muted">
     <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal/> {title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
          {showSpinner && (
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
     </Card>
   </div>
);

// This component now contains the providers that depend on a logged-in user.
const AuthenticatedApp = ({ children }: { children: React.ReactNode }) => {
  const { isReady, userInstitutions, currentInstitution } = useRoles();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isReady) return;

    if (userInstitutions.length === 0 && pathname !== '/institutions' && pathname !== '/users') {
      router.replace('/institutions');
    }
  }, [isReady, userInstitutions, pathname, router]);


  if (!isReady) {
    return (
      <FullscreenMessage title="Loading Your Profile..." showSpinner>
        <p className="text-center text-muted-foreground">Please wait while we prepare your workspace.</p>
      </FullscreenMessage>
    );
  }
  
  if (userInstitutions.length === 0) {
      if (pathname === '/institutions' || pathname === '/users') {
          return <AppLayout>{children}</AppLayout>;
      }
      return (
          <FullscreenMessage title="Setting Up..." showSpinner>
            <p className="text-center text-muted-foreground">No institution found. Preparing setup page.</p>
          </FullscreenMessage>
      );
  }

  if (!currentInstitution) {
    return <InstitutionSelector />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (authLoading) return; // Don't do anything until authentication state is resolved

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/users';

    if (user) {
        // If user is logged in, but on an auth page, redirect to dashboard
        if (isAuthPage) {
            router.replace('/dashboard');
        }
    } else {
        // If user is not logged in
        const appSettingsRef = ref(db, 'app_settings/isSuperAdminRegistered');
        get(appSettingsRef).then((snapshot) => {
            const isRegistered = snapshot.exists() && snapshot.val() === true;
            if (isRegistered) {
                // If admin exists, all non-logged-in users should go to login page
                if (pathname !== '/login') {
                    router.replace('/login');
                }
            } else {
                // If no admin, all non-logged-in users should go to the setup page
                if (pathname !== '/users') {
                    router.replace('/users');
                }
            }
        }).catch(error => {
            console.error("Error checking for first setup:", error);
            router.replace('/login'); // Default to login on error
        });
    }
}, [user, authLoading, pathname, router]);


  if (!isFirebaseConfigured()) {
    return (
        <FullscreenMessage title="Firebase Not Configured">
            <p className="text-destructive font-semibold">Action Required: Your Firebase credentials are not set up.</p>
            <p className="mt-2 text-muted-foreground">To use the application, you must add your Firebase project configuration to the file:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-2 text-sm">src/lib/firebase-client.ts</code>
        </FullscreenMessage>
    );
  }
  
  if (authLoading) {
    return (
      <FullscreenMessage title="Authenticating..." showSpinner>
        <p className="text-center text-muted-foreground">Please wait while we verify your credentials.</p>
      </FullscreenMessage>
    );
  }
  
  if (user) {
    return (
      <RolesProvider>
          <AuthenticatedApp>{children}</AuthenticatedApp>
      </RolesProvider>
    );
  }

  // If not logged in, show the child page (which will be one of the auth pages based on the useEffect logic)
  return <>{children}</>;
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
          <AppContainer>
            {children}
          </AppContainer>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
