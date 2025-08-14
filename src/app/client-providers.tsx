
'use client';

import { usePathname } from 'next/navigation';
import { DataProvider } from '@/hooks/use-database';
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { AppLayout } from '@/components/app-layout';
import { GlobalDateProvider } from '@/hooks/use-global-date.tsx';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const LayoutWrapper = isAuthPage ? <>{children}</> : <AppLayout>{children}</AppLayout>;

  return (
    <GlobalDateProvider>
        <DataProvider key={isFirebaseConfigured() ? 'configured' : 'not-configured'}>
        {LayoutWrapper}
        </DataProvider>
    </GlobalDateProvider>
  );
}
