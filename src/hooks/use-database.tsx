
'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import { useAuth } from './use-auth';

// The purpose of this provider is to centralize data fetching and ensure
// that no data is fetched until the user is authenticated. This prevents
// race conditions and permission errors on initial load.
const DataContext = createContext({});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  // This is a critical change to prevent race conditions.
  // We explicitly wait for the loading to finish before we mount the children,
  // which triggers all data hooks within pages.
  if (loading) {
    // While auth is loading, we render a placeholder. A proper loading screen would be better.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Authenticating...</p>
      </div>
    );
  }
  
  if (!user) {
    // If there's no user, just render the children (e.g., login page)
    // The data hooks will not be called.
    return <>{children}</>;
  }
  
  // If we have a user, we render the provider and children.
  return (
    <DataContext.Provider value={{}}>
        {children}
    </DataContext.Provider>
  );
}
