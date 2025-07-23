
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
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import LoginPage from './login/page';
import UsersPage from './users/page';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase-client';


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

function UnauthenticatedApp() {
  const { user, loading } = useAuth();
  const [isSetupComplete, setIsSetupComplete] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkSetup() {
      if (loading || !db) return;
      try {
        const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
        const snapshot = await get(setupRef);
        setIsSetupComplete(snapshot.exists() && snapshot.val() === true);
      } catch (error) {
        console.error("Error checking for Super Admin:", error);
        // Default to login ready to avoid getting stuck
        setIsSetupComplete(true);
      }
    }
    checkSetup();
  }, [loading]);

  if (isSetupComplete === null) {
      return (
        <FullscreenMessage title="Initializing..." showSpinner>
          <p>Please wait while we check the application status.</p>
        </FullscreenMessage>
      );
  }

  // If setup is not complete, show the user creation page (Super Admin setup).
  // This page will have its own logic to redirect if a user tries to access it directly when setup IS complete.
  if (!isSetupComplete) {
      return <UsersPage isFirstSetup={true} />;
  }
  
  // Default to showing the login page if setup is complete.
  return <LoginPage />;
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
      <InstitutionProvider>
        <RolesProvider>
           <AppLayout>{children}</AppLayout>
        </RolesProvider>
      </InstitutionProvider>
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
