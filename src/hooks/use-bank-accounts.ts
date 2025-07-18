'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BankAccount } from '@/lib/types';

const STORAGE_KEY = 'pumppal-bank-accounts';

export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setBankAccounts(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse bank accounts from localStorage", error);
      setBankAccounts([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bankAccounts));
      } catch (error) {
        console.error("Failed to save bank accounts to localStorage", error);
      }
    }
  }, [bankAccounts, isLoaded]);

  const addBankAccount = useCallback((account: Omit<BankAccount, 'id' | 'timestamp'>) => {
    setBankAccounts(prev => [
      { ...account, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const clearBankAccounts = useCallback(() => {
    setBankAccounts([]);
  }, []);

  return { bankAccounts, addBankAccount, clearBankAccounts, isLoaded };
}
