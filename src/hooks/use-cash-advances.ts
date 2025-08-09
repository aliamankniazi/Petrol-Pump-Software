
'use client';

import { useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'cash-advances';

export function useCashAdvances() {
  const { data: cashAdvances, addDoc, deleteDoc, loading } = useDatabaseCollection<CashAdvance>(COLLECTION_NAME);

  const addCashAdvance = useCallback((advance: Omit<CashAdvance, 'id'>) => {
    const advanceWithTimestamp = {
      ...advance,
      timestamp: advance.timestamp || new Date().toISOString(),
    };
    addDoc(advanceWithTimestamp);
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
