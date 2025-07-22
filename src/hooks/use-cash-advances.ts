
'use client';

import { useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution';

const COLLECTION_NAME = 'cash-advances';

export function useCashAdvances() {
  const { currentInstitution } = useInstitution();
  const { data: cashAdvances, addDoc, deleteDoc, loading } = useDatabaseCollection<CashAdvance>(COLLECTION_NAME, currentInstitution?.id || null);

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
