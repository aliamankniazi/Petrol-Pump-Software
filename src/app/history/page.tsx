
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and now redirects to the new unified transactions page.
export default function HistoryPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/all-transactions');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Redirecting to All Transactions...</p>
    </div>
  );
}
