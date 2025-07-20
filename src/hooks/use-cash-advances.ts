
'use client';

import { useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'cash-advances';

export function useCashAdvances() {
  const { data: cashAdvances, addDoc, deleteDoc, loading } = useFirestoreCollection<CashAdvance>(COLLECTION_NAME);

  const addCashAdvance = useCallback((advance: Omit<CashAdvance, 'id'>) => {
    addDoc(advance);
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
