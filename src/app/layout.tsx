
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname } from 'next/navigation';
import { RolesProvider } from '@/hooks/use-roles';
import { InstitutionProvider } from '@/hooks/use-institution';
import { AppLayout } from '@/components/app-layout';
import { isFirebaseConfigured, db } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import LoginPage from './login/page';
import UsersPage from './users/page';
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

function AppContainer({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [setupState, setSetupState] = React.useState<'checking' | 'needs_setup' | 'login_ready'>('checking');

  React.useEffect(() => {
    async function checkSetup() {
      if (authLoading) return; // Wait until auth state is confirmed

      if (!user) { // Only check if the user is not logged in
        if (!db) {
          setSetupState('login_ready'); // Default to login if DB isn't configured, to show firebase config error
          return;
        }
        try {
          const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
          const snapshot = await get(setupRef);
          if (snapshot.exists() && snapshot.val() === true) {
            setSetupState('login_ready');
          } else {
            setSetupState('needs_setup');
          }
        } catch (error) {
          console.error("Error checking for Super Admin:", error);
          setSetupState('login_ready'); // Default to login on error to avoid getting stuck
        }
      }
    }
    checkSetup();
  }, [authLoading, user]);

  if (!isFirebaseConfigured()) {
    return (
        <FullscreenMessage title="Firebase Not Configured">
            <p className="text-destructive font-semibold">Action Required: Your Firebase credentials are not set up.</p>
            <p className="mt-2 text-muted-foreground">To use the application, you must add your Firebase project configuration to the file:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-2 text-sm">src/lib/firebase-client.ts</code>
        </FullscreenMessage>
    );
  }

  if (authLoading || (!user && setupState === 'checking')) {
    return (
      <FullscreenMessage title="Initializing..." showSpinner>
        <p className="text-center text-muted-foreground">Please wait while we prepare the application.</p>
      </FullscreenMessage>
    );
  }

  if (user) {
    return (
      <InstitutionProvider>
        <RolesProvider>
           <AppLayout>{children}</AppLayout>
        </RolesProvider>
      </InstitutionProvider>
    );
  }
  
  // Unauthenticated user flow
  if (setupState === 'needs_setup') {
    return <UsersPage isFirstSetup={true} />;
  }

  if (setupState === 'login_ready') {
    return <LoginPage />;
  }
  
  // Fallback, should not be reached if logic is correct
  return (
      <FullscreenMessage title="An Error Occurred" showSpinner>
        <p className="text-center text-muted-foreground">Could not determine application state. Please refresh the page.</p>
      </FullscreenMessage>
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
