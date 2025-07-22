
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
import { isFirebaseConfigured } from '@/lib/firebase-client';

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

function AppContainer({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isReady: rolesReady, hasPermission } = useRoles();
  const pathname = usePathname();
  const router = useRouter();
  
  const configured = isFirebaseConfigured();
  const isLoading = configured ? (authLoading || !rolesReady) : false;

  React.useEffect(() => {
    if (isLoading || !configured) return;

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

  }, [user, isLoading, rolesReady, pathname, router, configured]);

  if (isLoading) {
    return <FullscreenLoader />;
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (!configured) {
    // If not configured, just show the children, which will include the alert
    // from the specific page (e.g., Sales Page)
     return <>{children}</>;
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
