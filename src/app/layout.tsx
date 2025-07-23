
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

const UnauthenticatedApp = () => {
    const [isSetupComplete, setIsSetupComplete] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkSetup = async () => {
            if (!db) {
                console.error("Database not initialized, cannot check setup.");
                setIsSetupComplete(true); // Default to login on error
                return;
            };
            try {
                const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
                const snapshot = await get(setupRef);
                setIsSetupComplete(snapshot.exists() && snapshot.val() === true);
            } catch (error) {
                console.error("Setup check failed:", error);
                // This might happen due to security rules. Default to assuming setup is complete.
                setIsSetupComplete(true);
            }
        };
        checkSetup();
    }, []);

    if (isSetupComplete === null) {
        return (
            <FullscreenMessage title="Initializing..." showSpinner>
                <p>Checking application setup.</p>
            </FullscreenMessage>
        );
    }
    
    // Once setup check is complete, render the correct page.
    // The individual pages will handle any necessary redirects if the state is wrong.
    if (isSetupComplete) {
        return <LoginPage />;
    } else {
        return <UsersPage />;
    }
};


const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

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
  
  const isPublicAuthRoute = ['/login', '/users'].includes(pathname);

  // If we are on a specific auth page, let it render.
  // The UnauthenticatedApp component will determine which page to show.
  if (isPublicAuthRoute) {
      return <UnauthenticatedApp />;
  }
  
  // Default for any other route when not logged in
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
