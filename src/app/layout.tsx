
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname, useRouter } from 'next/navigation';
import { RolesProvider, useRoles } from '@/hooks/use-roles.tsx';
import { AppLayout } from '@/components/app-layout';
import { isFirebaseConfigured } from '@/lib/firebase-client';
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
  const { currentInstitution, isReady, userInstitutions } = useRoles();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // This effect runs only after the initial readiness check.
    if (!isReady) return;

    // If the user has no institutions, they should be on the institutions page to create one.
    if (userInstitutions.length === 0 && pathname !== '/institutions') {
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
      // Allow rendering the institutions page within the layout.
      if (pathname === '/institutions') {
          return <AppLayout>{children}</AppLayout>;
      }
      // Otherwise, show a loading/redirecting message while the effect above does its work.
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

  // Handle redirects within a useEffect hook to prevent errors during render.
  React.useEffect(() => {
    if (authLoading) return; // Don't do anything while auth state is resolving

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/dashboard');
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
  
  // Show a generic loading screen while auth is resolving or redirects are pending.
  if (authLoading) {
    return (
      <FullscreenMessage title="Authenticating..." showSpinner>
        <p className="text-center text-muted-foreground">Please wait while we verify your credentials.</p>
      </FullscreenMessage>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  // If we are on an auth page, render it directly.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If there's no user, show a redirecting message. The useEffect will handle the redirect.
  if (!user) {
    return (
      <FullscreenMessage title="Redirecting..." showSpinner>
        <p className="text-center text-muted-foreground">You are not logged in. Redirecting to the login page.</p>
      </FullscreenMessage>
    );
  }

  // User is logged in and not on an auth page, render the full app with providers.
  return (
    <RolesProvider>
        <AuthenticatedApp>{children}</AuthenticatedApp>
    </RolesProvider>
  );
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
