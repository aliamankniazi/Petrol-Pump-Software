
'use client';

import { useCallback } from 'react';
import type { BankAccount } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'bank-accounts';

export function useBankAccounts() {
  const { data: bankAccounts, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<BankAccount>(COLLECTION_NAME);

  const addBankAccount = useCallback((account: Omit<BankAccount, 'id' | 'timestamp'>) => {
    return addDoc(account);
  }, [addDoc]);
  
  const updateBankAccount = useCallback((id: string, updatedDetails: Partial<Omit<BankAccount, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteBankAccount = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    bankAccounts: bankAccounts || [], 
    addBankAccount, 
    updateBankAccount, 
    deleteBankAccount, 
    isLoaded: !loading 
  };
}
