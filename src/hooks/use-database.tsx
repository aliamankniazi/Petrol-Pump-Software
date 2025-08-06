
'use client';

import { createContext, type ReactNode } from 'react';

// This provider is now a simple wrapper and does not hold state.
// It's kept for structural consistency in case global state is needed later.
export const DataContext = createContext({});

export function DataProvider({ children }: { children: ReactNode }) {
  return <DataContext.Provider value={{}}>{children}</DataContext.Provider>;
}
