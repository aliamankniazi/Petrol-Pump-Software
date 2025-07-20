
'use client';

import { useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'cash-advances';

export function useCashAdvances() {
  const { data: cashAdvances, setData: setCashAdvances, isLoaded } = useLocalStorage<CashAdvance[]>(STORAGE_KEY, []);

  const addCashAdvance = useCallback((advance: Omit<CashAdvance, 'id'>) => {
    setCashAdvances(prev => [
      { ...advance, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setCashAdvances]);
  
  const deleteCashAdvance = useCallback((id: string) => {
    setCashAdvances(prev => (prev || []).filter(ca => ca.id !== id));
  }, [setCashAdvances]);

  const clearCashAdvances = useCallback(() => {
    setCashAdvances([]);
  }, [setCashAdvances]);

  return { cashAdvances: cashAdvances || [], addCashAdvance, deleteCashAdvance, clearCashAdvances, isLoaded };
}
