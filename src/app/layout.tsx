
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


function UnauthenticatedApp() {
    const [isSetupComplete, setIsSetupComplete] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkSetup = async () => {
            if (!db) {
                console.error("Firebase DB not available for setup check.");
                setIsSetupComplete(true); // Default to login if DB is not there
                return;
            }
            const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
            try {
                const snapshot = await get(setupRef);
                setIsSetupComplete(snapshot.exists() && snapshot.val() === true);
            } catch (error) {
                console.error("Error checking app setup:", error);
                setIsSetupComplete(true); // Default to login on error
            }
        };

        checkSetup();
    }, []);

    if (isSetupComplete === null) {
        return (
            <FullscreenMessage title="Initializing...">
                <div className="flex flex-col items-center justify-center gap-2">
                    <p>Checking application state. Please wait.</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </FullscreenMessage>
        );
    }
    
    if (isSetupComplete) {
        return <LoginPage />;
    }

    return <UsersPage isFirstSetup={true} />;
}


function AppContainer({ children }: { children: React.ReactNode }) {
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
          <FullscreenMessage title="Initializing...">
             <div className="flex flex-col items-center justify-center gap-2">
                <p>Authenticating. Please wait.</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </FullscreenMessage>
      );
  }
  
  if (user) {
    return (
      <InstitutionProvider>
        <RolesProvider>
            {children}
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
            <AppLayout>{children}</AppLayout>
          </AppContainer>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
