
'use client';

import { useCallback } from 'react';
import type { Expense } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'expenses';

export function useExpenses() {
  const { data: expenses, addDoc, deleteDoc, loading } = useFirestoreCollection<Expense>(COLLECTION_NAME);

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
