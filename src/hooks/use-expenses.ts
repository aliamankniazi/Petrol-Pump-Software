
'use client';

import { useCallback } from 'react';
import type { Expense } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

const COLLECTION_NAME = 'expenses';

export function useExpenses() {
  const { currentInstitution } = useInstitution();
  const { data: expenses, addDoc, deleteDoc, loading } = useDatabaseCollection<Expense>(COLLECTION_NAME, currentInstitution?.id || null);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    addDoc(expense);
  }, [addDoc]);
  
  const deleteExpense = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    expenses: expenses || [], 
    addExpense, 
    deleteExpense, 
    isLoaded: !loading 
  };
}
