
'use client';

import { useCallback } from 'react';
import type { OtherIncome } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'other-incomes';

export function useOtherIncomes() {
  const { data: otherIncomes, addDoc, deleteDoc, loading } = useDatabaseCollection<OtherIncome>(COLLECTION_NAME);

  const addOtherIncome = useCallback((income: Omit<OtherIncome, 'id'>) => {
    addDoc(income);
  }, [addDoc]);

  const deleteOtherIncome = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);
  
  return { 
    otherIncomes: otherIncomes || [], 
    addOtherIncome, 
    deleteOtherIncome, 
    isLoaded: !loading 
  };
}
