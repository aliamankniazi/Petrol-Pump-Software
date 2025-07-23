
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
import LoginPage from './login/page';
import UsersPage from './users/page';
import { ref, get } from 'firebase/database';
import { InstitutionSelector } from '@/components/institution-selector';

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

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { currentInstitution, institutionLoading } = useRoles();

  if (institutionLoading) {
    return (
      <FullscreenMessage title="Loading Institutions..." showSpinner>
        <p>Please wait while we load your institution data.</p>
      </FullscreenMessage>
    );
  }

  if (currentInstitution) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <InstitutionSelector />;
}

function UnauthenticatedApp() {
    const [setupState, setSetupState] = React.useState<'checking' | 'needs_setup' | 'login_required'>('checking');
    
    React.useEffect(() => {
        const checkSetup = async () => {
            if (!db) {
                console.error("DB not ready for setup check.");
                // Default to login if DB is not available for some reason
                setSetupState('login_required');
                return;
            }
            try {
                const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
                const snapshot = await get(setupRef);
                if (snapshot.exists() && snapshot.val() === true) {
                    setSetupState('login_required');
                } else {
                    setSetupState('needs_setup');
                }
            } catch (error) {
                console.error("Error checking for Super Admin:", error);
                setSetupState('login_required'); // Fail safe to login
            }
        };

        checkSetup();
    }, []);
    
    switch (setupState) {
        case 'checking':
            return (
                <FullscreenMessage title="Initializing..." showSpinner>
                    <p>Please wait while we check the application status.</p>
                </FullscreenMessage>
            );
        case 'needs_setup':
            return <UsersPage />;
        case 'login_required':
            return <LoginPage />;
        default:
            return <LoginPage />;
    }
}


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
          <AuthenticatedApp>{children}</AuthenticatedApp>
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
