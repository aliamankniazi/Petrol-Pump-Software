
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { usePathname } from 'next/navigation';
import { RolesProvider, useRoles } from '@/hooks/use-roles.tsx';
import { InstitutionProvider, useInstitution } from '@/hooks/use-institution.tsx';
import { AppLayout } from '@/components/app-layout';
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import LoginPage from './login/page';
import { InstitutionSelector } from '@/components/institution-selector';
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
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          {children}
          {showSpinner && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>}
        </CardContent>
     </Card>
   </div>
);


function AppContent({ children }: { children: React.ReactNode }) {
    const { currentInstitution, institutionLoading } = useInstitution();
    const { isReady: rolesReady } = useRoles();

    if (institutionLoading) {
        return (
            <FullscreenMessage title="Loading Institutions..." showSpinner={true}>
                <p>Fetching your user profile and institutions.</p>
            </FullscreenMessage>
        );
    }
    
    if (!currentInstitution) {
        return <InstitutionSelector />;
    }
    
    if (!rolesReady) {
        return (
            <FullscreenMessage title="Loading Roles..." showSpinner={true}>
                <p>Loading permissions for {currentInstitution.name}.</p>
            </FullscreenMessage>
        );
    }

    return <AppLayout>{children}</AppLayout>;
}


function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  return (
    <InstitutionProvider>
        <RolesProvider>
            <AppContent>
                {children}
            </AppContent>
        </RolesProvider>
    </InstitutionProvider>
  )
}

function UnauthenticatedApp() {
  const pathname = usePathname();
  // We explicitly show UsersPage for setup, otherwise default to login.
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
