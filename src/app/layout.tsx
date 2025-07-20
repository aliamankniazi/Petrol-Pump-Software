
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { RolesProvider } from '@/hooks/use-roles';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Metadata can't be exported from a client component.
// We can set the document title dynamically within components if needed.

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
          <PrintStyles />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <RolesProvider>
            {children}
          </RolesProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
