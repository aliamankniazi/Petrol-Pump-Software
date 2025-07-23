
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
  const { currentInstitution, isReady, loading } = useRoles();

  if (loading || !isReady) {
    return (
      <FullscreenMessage title="Loading Your Profile..." showSpinner>
        <p className="text-center text-muted-foreground">Please wait while we prepare your workspace.</p>
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

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!user) {
    if (!isAuthPage) {
      router.replace('/login');
      return (
         <FullscreenMessage title="Redirecting..." showSpinner>
          <p className="text-center text-muted-foreground">You are not logged in. Redirecting to the login page.</p>
        </FullscreenMessage>
      );
    }
    // Render login/signup pages without the full authenticated layout
    return <>{children}</>;
  }
  
  // User is logged in
  if (isAuthPage) {
      router.replace('/dashboard');
      return (
        <FullscreenMessage title="Redirecting..." showSpinner>
          <p className="text-center text-muted-foreground">You are already logged in. Redirecting to the dashboard.</p>
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
