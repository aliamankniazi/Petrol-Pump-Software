
'use client';

import { createContext, type ReactNode } from 'react';

// This context provides a single, hardcoded institution ID for the entire app.
// It simplifies development by removing the need for multi-institution logic.
const DEFAULT_INSTITUTION_ID = 'default-institution';

interface DataContextType {
  institutionId: string | null;
}

export const DataContext = createContext<DataContextType>({
  institutionId: DEFAULT_INSTITUTION_ID,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const value = {
    institutionId: DEFAULT_INSTITUTION_ID,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
