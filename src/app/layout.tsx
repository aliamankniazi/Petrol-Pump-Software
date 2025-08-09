import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { ThemeScript } from '@/components/theme-script';
import { ClientProviders } from './client-providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function PrintStyles() {
    return <link rel="stylesheet" href="/print-globals.css" media="print" />;
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
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}
