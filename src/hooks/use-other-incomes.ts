
'use client';

import { useCallback } from 'react';
import type { OtherIncome } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'other-incomes';

export function useOtherIncomes() {
  const { data: otherIncomes, setData: setOtherIncomes, isLoaded } = useLocalStorage<OtherIncome[]>(STORAGE_KEY, []);

  const addOtherIncome = useCallback((income: Omit<OtherIncome, 'id'>) => {
    setOtherIncomes(prev => [
      { ...income, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setOtherIncomes]);

  const deleteOtherIncome = useCallback((id: string) => {
    setOtherIncomes(prev => (prev || []).filter(oi => oi.id !== id));
  }, [setOtherIncomes]);
  
  const clearOtherIncomes = useCallback(() => {
    setOtherIncomes([]);
  }, [setOtherIncomes]);

  return { otherIncomes: otherIncomes || [], addOtherIncome, deleteOtherIncome, clearOtherIncomes, isLoaded };
}
