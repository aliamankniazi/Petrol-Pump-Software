
'use client';

import { useCallback } from 'react';
import type { OtherIncome } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

const COLLECTION_NAME = 'other-incomes';

export function useOtherIncomes() {
  const { currentInstitution } = useInstitution();
  const { data: otherIncomes, addDoc, deleteDoc, loading } = useDatabaseCollection<OtherIncome>(COLLECTION_NAME, currentInstitution?.id || null);

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
