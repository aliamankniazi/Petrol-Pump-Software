
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname } from 'next/navigation';
import { RolesProvider } from '@/hooks/use-roles.tsx';
import { AppLayout } from '@/components/app-layout';
import { isFirebaseConfigured, db } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { ref, get } from 'firebase/database';
import LoginPage from './login/page';
import UsersPage from './users/page';

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


const UnauthenticatedApp = () => {
    type SetupState = 'CHECKING' | 'SETUP_NEEDED' | 'LOGIN_REQUIRED';
    const [setupState, setSetupState] = React.useState<SetupState>('CHECKING');

    React.useEffect(() => {
        const checkSetup = async () => {
            if (!db) {
                console.error("Database not initialized, cannot check setup.");
                setSetupState('LOGIN_REQUIRED');
                return;
            };
            try {
                const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
                const snapshot = await get(setupRef);
                if (snapshot.exists() && snapshot.val() === true) {
                    setSetupState('LOGIN_REQUIRED');
                } else {
                    setSetupState('SETUP_NEEDED');
                }
            } catch (error) {
                console.error("Setup check failed:", error);
                setSetupState('LOGIN_REQUIRED');
            }
        };

        checkSetup();
    }, []);

    switch (setupState) {
        case 'CHECKING':
            return (
                <FullscreenMessage title="Initializing..." showSpinner>
                    <p>Checking application setup.</p>
                </FullscreenMessage>
            );
        case 'SETUP_NEEDED':
            return <UsersPage />;
        case 'LOGIN_REQUIRED':
            return <LoginPage />;
        default:
            return <LoginPage />;
    }
};


const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  
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
          <AppLayout>{children}</AppLayout>
      </RolesProvider>
    );
  }
  
  return <UnauthenticatedApp />;
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
