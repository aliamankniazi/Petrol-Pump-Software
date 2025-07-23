
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname } from 'next/navigation';
import { RolesProvider } from '@/hooks/use-roles';
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

type AppState = 'INITIALIZING' | 'NEEDS_SETUP' | 'LOGIN_REQUIRED' | 'AUTHENTICATED';

function AppContainer({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [appState, setAppState] = React.useState<AppState>('INITIALIZING');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // This ensures that any logic depending on client-side state
    // runs only after the component has mounted on the client.
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) {
      // Don't run state-changing logic on the server or before client hydration.
      return;
    }

    if (authLoading) {
      setAppState('INITIALIZING');
      return;
    }

    if (user) {
      setAppState('AUTHENTICATED');
    } else {
      // No user, check if setup is needed
      const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
      get(setupRef).then((snapshot) => {
        if (snapshot.exists() && snapshot.val() === true) {
          setAppState('LOGIN_REQUIRED');
        } else {
          setAppState('NEEDS_SETUP');
        }
      }).catch((error) => {
        console.error("Error checking app setup:", error);
        setAppState('LOGIN_REQUIRED'); // Default to login on error
      });
    }
  }, [user, authLoading, isClient]);

  if (!isFirebaseConfigured()) {
    return (
        <FullscreenMessage title="Firebase Not Configured">
            <p className="text-destructive font-semibold">Action Required: Your Firebase credentials are not set up.</p>
            <p className="mt-2 text-muted-foreground">To use the application, you must add your Firebase project configuration to the file:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-2 text-sm">src/lib/firebase-client.ts</code>
        </FullscreenMessage>
    );
  }

  if (appState === 'INITIALIZING') {
      return (
          <FullscreenMessage title="Initializing..." showSpinner>
              <p className="text-center text-muted-foreground">Checking application state. Please wait.</p>
          </FullscreenMessage>
      );
  }
  
  if (appState === 'AUTHENTICATED') {
    return <RolesProvider>{children}</RolesProvider>;
  }
  
  if (appState === 'NEEDS_SETUP') {
    return <UsersPage isFirstSetup={true} />;
  }
  
  if (appState === 'LOGIN_REQUIRED') {
    return <LoginPage />;
  }

  // Fallback for initial render before client-side logic runs
  return (
      <FullscreenMessage title="Initializing..." showSpinner>
          <p className="text-center text-muted-foreground">Preparing the application.</p>
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
            <AppLayout>{children}</AppLayout>
          </AppContainer>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
