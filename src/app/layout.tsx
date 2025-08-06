
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import { ThemeScript } from '@/components/theme-script';
import { DataProvider } from '@/hooks/use-database';
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
        <DataProvider key={isFirebaseConfigured() ? 'configured' : 'not-configured'}>
            <AppLayout>
              {children}
            </AppLayout>
        </DataProvider>
        <Toaster />
      </body>
    </html>
  );
}
