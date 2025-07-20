
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'transactions';

export function useTransactions() {
  const { data: transactions, setData: setTransactions, isLoaded } = useLocalStorage<Transaction[]>(STORAGE_KEY, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [
      { ...transaction, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setTransactions]);
  
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => (prev || []).filter(tx => tx.id !== id));
  }, [setTransactions]);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, [setTransactions]);

  return { transactions: transactions || [], addTransaction, deleteTransaction, clearTransactions, isLoaded };
}
