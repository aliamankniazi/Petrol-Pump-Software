
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
  const { data: transactions, addDoc, deleteDoc, loading } = useFirestoreCollection<Transaction>(COLLECTION_NAME);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    addDoc(transaction);
  }, [addDoc]);
  
  const deleteTransaction = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    transactions: transactions || [], 
    addTransaction, 
    deleteTransaction, 
    isLoaded: !loading 
  };
}
