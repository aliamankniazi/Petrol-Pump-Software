import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Mianwali Petroleum Service',
  description: 'Petrol pump management software.',
};

function AppContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const isAuthPage = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup');

    if (user && !isAuthPage) {
        return <AppLayout>{children}</AppLayout>
    }
    return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppContent>
            {children}
          </AppContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
