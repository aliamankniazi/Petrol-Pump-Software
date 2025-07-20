
'use client';

import { useCallback } from 'react';
import type { BankAccount } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'bank-accounts';

export function useBankAccounts() {
  const { data: bankAccounts, setData: setBankAccounts, isLoaded } = useLocalStorage<BankAccount[]>(STORAGE_KEY, []);

  const addBankAccount = useCallback((account: Omit<BankAccount, 'id' | 'timestamp'>) => {
    setBankAccounts(prev => [
      { ...account, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...(prev || []),
    ]);
  }, [setBankAccounts]);
  
  const updateBankAccount = useCallback((id: string, updatedDetails: Partial<Omit<BankAccount, 'id' | 'timestamp'>>) => {
    setBankAccounts(prev => (prev || []).map(acc => acc.id === id ? { ...acc, ...updatedDetails } : acc));
  }, [setBankAccounts]);

  const deleteBankAccount = useCallback((id: string) => {
    setBankAccounts(prev => (prev || []).filter(acc => acc.id !== id));
  }, [setBankAccounts]);

  const clearBankAccounts = useCallback(() => {
    setBankAccounts([]);
  }, [setBankAccounts]);

  return { bankAccounts: bankAccounts || [], addBankAccount, updateBankAccount, deleteBankAccount, clearBankAccounts, isLoaded };
}
