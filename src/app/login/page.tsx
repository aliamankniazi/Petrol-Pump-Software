
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is no longer used and now redirects to the dashboard.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Redirecting...</p>
    </div>
  );
}
