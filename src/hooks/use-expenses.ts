
'use client';

import { useCallback } from 'react';
import type { Expense } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'expenses';

export function useExpenses() {
  const { data: expenses, addDoc, deleteDoc, loading } = useDatabaseCollection<Expense>(COLLECTION_NAME);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const expenseWithTimestamp = {
      ...expense,
      timestamp: expense.date,
    }
    addDoc(expenseWithTimestamp);
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

    
