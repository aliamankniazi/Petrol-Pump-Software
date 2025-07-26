
'use client';

import { createContext, type ReactNode } from 'react';

interface DataContextType {
  institutionId: string | null;
}

export const DataContext = createContext<DataContextType>({
  institutionId: null,
});

export function DataProvider({ children, institutionId }: { children: ReactNode, institutionId: string | null }) {
  const value = {
    institutionId,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
