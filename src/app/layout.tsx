
'use client'; 

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { ThemeScript } from '@/components/theme-script';
import { DataProvider } from '@/hooks/use-database';
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function PrintStyles() {
    return <link rel="stylesheet" href="/print-globals.css" media="print" />;
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return <AppLayout>{children}</AppLayout>;
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
      <body>
        <DataProvider key={isFirebaseConfigured() ? 'configured' : 'not-configured'}>
            <LayoutWrapper>
                {children}
            </LayoutWrapper>
        </DataProvider>
        <Toaster />
      </body>
    </html>
  );
}
