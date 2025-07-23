
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
  const { currentInstitution } = useRoles();
  const { data: transactions, addDoc, deleteDoc, loading } = useDatabaseCollection<Transaction>(COLLECTION_NAME, currentInstitution?.id || null);

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
