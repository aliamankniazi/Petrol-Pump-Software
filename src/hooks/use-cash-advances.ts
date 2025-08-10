
'use client';

import { useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'cash-advances';

export function useCashAdvances() {
  const { data: cashAdvances, addDoc, deleteDoc, loading } = useDatabaseCollection<CashAdvance>(COLLECTION_NAME);

  const addCashAdvance = useCallback((advance: Omit<CashAdvance, 'id' | 'timestamp'>) => {
    const advanceWithTimestamp = {
      ...advance,
      timestamp: advance.date.toISOString(),
    };
    addDoc(advanceWithTimestamp as CashAdvance);
  }, [addDoc]);
  
  const deleteCashAdvance = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    cashAdvances: cashAdvances || [], 
    addCashAdvance, 
    deleteCashAdvance, 
    isLoaded: !loading 
  };
}
