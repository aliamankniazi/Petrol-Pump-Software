
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import LoginPage from './login/page';
import { InstitutionSelector } from '@/components/institution-selector';
import UsersPage from './users/page';
import { ThemeScript } from '@/components/theme-script';

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
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          {children}
          {showSpinner && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>}
        </CardContent>
     </Card>
   </div>
);

function AppContent({ children }: { children: React.ReactNode }) {
    const { currentInstitution, userInstitutions, isReady } = useRoles();
    const router = useRouter();

    if (!isReady) {
        return (
            <FullscreenMessage title="Loading Application..." showSpinner={true}>
                <p>Fetching your profile and permissions. Please wait.</p>
            </FullscreenMessage>
        );
    }
    
    if (userInstitutions.length > 0 && !currentInstitution) {
        return <InstitutionSelector />;
    }

    if (isReady && userInstitutions.length === 0) {
        React.useEffect(() => {
            router.replace('/institutions');
        }, [router]);

        return (
             <FullscreenMessage title="Welcome!" showSpinner={true}>
                <p>Redirecting you to create your first institution...</p>
            </FullscreenMessage>
        );
    }

    if (currentInstitution) {
        return (
            <AppLayout>
                {children}
            </AppLayout>
        );
    }

    return (
        <FullscreenMessage title="Initializing..." showSpinner={true}>
            <p>Please wait a moment.</p>
        </FullscreenMessage>
    );
}

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  return (
    <RolesProvider>
      <AppContent>
          {children}
      </AppContent>
    </RolesProvider>
  )
}

function UnauthenticatedApp() {
  const pathname = usePathname();
  if (pathname === '/users') {
    return <UsersPage />;
  }
  return <LoginPage />;
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
          <FullscreenMessage title="Authenticating..." showSpinner={true}>
             <p>Checking your credentials. Please wait.</p>
          </FullscreenMessage>
      );
  }
  
  if (user) {
    return <AuthenticatedApp>{children}</AuthenticatedApp>;
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
          <ThemeScript />
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
