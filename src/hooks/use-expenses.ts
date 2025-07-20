
'use client';

import { useCallback } from 'react';
import type { Expense } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'expenses';

export function useExpenses() {
  const { data: expenses, setData: setExpenses, isLoaded, clearDataForUser } = useLocalStorage<Expense[]>(STORAGE_KEY, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
        const newExpenses = [{ ...expense, id: crypto.randomUUID() }, ...(prev || [])];
        return newExpenses.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [setExpenses]);
  
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => (prev || []).filter(e => e.id !== id));
  }, [setExpenses]);

  const clearExpenses = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { expenses: expenses || [], addExpense, deleteExpense, clearExpenses, isLoaded };
}
