
'use client';

// This page is deprecated. Please use /purchases instead.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedPurchasesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/purchases');
  }, [router]);

  return <p>Redirecting...</p>;
}
