
'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

interface GlobalDateContextType {
  globalDateRange: DateRange | undefined;
  setGlobalDateRange: (dateRange: DateRange | undefined) => void;
}

const GlobalDateContext = createContext<GlobalDateContextType | undefined>(undefined);

export function GlobalDateProvider({ children }: { children: ReactNode }) {
  const [globalDateRange, setGlobalDateRange] = useState<DateRange | undefined>();

  return (
    <GlobalDateContext.Provider value={{ globalDateRange, setGlobalDateRange }}>
      {children}
    </GlobalDateContext.Provider>
  );
}

export function useGlobalDate() {
  const context = useContext(GlobalDateContext);
  if (context === undefined) {
    throw new Error('useGlobalDate must be used within a GlobalDateProvider');
  }
  return context;
}
