
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { RolesProvider, useRoles } from '@/hooks/use-roles';
import { AppLayout } from '@/components/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import VerifyEmailPage from './verify-email/page';
import { firebaseConfig } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

const FullscreenLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
       <div className="space-y-4 w-1/2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
       </div>
   </div>
);

const FirebaseNotConfiguredAlert = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <Alert variant="destructive" className="max-w-md">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Firebase Not Configured</AlertTitle>
      <AlertDescription>
        The application is running in a limited, offline mode. To enable saving data, login, and all other features, please add your Firebase credentials to <strong>src/lib/firebase.ts</strong>.
      </AlertDescription>
    </Alert>
  </div>
);


function AppContainer({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isReady: rolesReady, hasPermission } = useRoles();
  const pathname = usePathname();
  const router = useRouter();
  
  const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("AIzaSy");
  const isLoading = isConfigured ? (authLoading || !rolesReady) : false;

  React.useEffect(() => {
    if (isLoading || !isConfigured) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isVerifyPage = pathname === '/verify-email';
    
    if (user) { 
      if (!user.emailVerified) {
        if (!isVerifyPage) router.replace('/verify-email');
      } else { 
        if (isAuthPage || isVerifyPage) router.replace('/dashboard');
      }
    } else { 
      if (!isAuthPage) router.replace('/login');
    }

  }, [user, isLoading, rolesReady, pathname, router, isConfigured]);

  if (isLoading) {
    return <FullscreenLoader />;
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!isConfigured) {
      if (isAuthPage) {
          return (
              <div>
                  <FirebaseNotConfiguredAlert />
                  {children}
              </div>
          );
      }
      return <AppLayout hasPermission={() => true}>{children}<FirebaseNotConfiguredAlert/></AppLayout>;
  }


  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  if (!user.emailVerified) {
    return <VerifyEmailPage />;
  }

  return <AppLayout hasPermission={hasPermission}>{children}</AppLayout>;
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
          <RolesProvider>
            <AppContainer>
              {children}
            </AppContainer>
          </RolesProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
